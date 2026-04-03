import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as Linking from 'expo-linking';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Screen from '../components/Screen';
import TypingDots from '../components/TypingDots';
import { colors } from '../theme/colors';
import { askRag, filePathToDownloadUrl, uploadDefensePdf } from '../services/rag';
import { getApiBaseUrl } from '../services/ai';

// Example-only screen (not wired into navigation by default).
// Requires: expo-document-picker (and Expo runtime).
export default function RagChatExampleScreen() {
  const insets = useSafeAreaInsets();
  const [sector, setSector] = useState('');
  const [uploadStatus, setUploadStatus] = useState('No PDF uploaded yet');

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState(() => [
    {
      id: 'm0',
      role: 'ai',
      text: 'Upload a defence PDF, then ask a grounded question. I will return sources (PDF name + page).',
      sources: [],
    },
  ]);

  const abortRef = useRef(null);
  const baseUrl = useMemo(() => getApiBaseUrl(), []);

  const pickAndUpload = useCallback(async () => {
    // 1) Pick PDF from device
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled) return;
    const asset = result.assets?.[0];
    if (!asset?.uri) throw new Error('No PDF selected');

    setUploadStatus('Uploading + indexing...');

    // 2) Upload to backend and index into vector search
    const response = await uploadDefensePdf({
      uri: asset.uri,
      name: asset.name,
      mimeType: asset.mimeType,
      sector,
    });

    setUploadStatus(`Indexed: ${response?.pdfName || asset.name} (chunks: ${response?.chunks || 0})`);
  }, [sector]);

  const send = useCallback(
    async (question) => {
      const clean = String(question || '').trim();
      if (!clean || isTyping) return;

      const userMsg = { id: `u_${Date.now()}`, role: 'user', text: clean };
      setMessages((m) => [userMsg, ...m]);
      setInput('');
      setIsTyping(true);

      try {
        abortRef.current?.abort?.();
        abortRef.current = new AbortController();

        // 3) Ask backend RAG route
        const payload = await askRag({ question: clean, sector, signal: abortRef.current.signal });
        const aiMsg = {
          id: `a_${Date.now()}`,
          role: 'ai',
          text: String(payload?.answer || ''),
          sources: Array.isArray(payload?.sources) ? payload.sources : [],
        };
        setMessages((m) => [aiMsg, ...m]);
      } catch (e) {
        const msg = {
          id: `e_${Date.now()}`,
          role: 'ai',
          text: `RAG request failed. Check backend is running and EXPO_PUBLIC_API_BASE_URL is correct.\n\nError: ${
            e?.message || 'Unknown error'
          }`,
          sources: [],
        };
        setMessages((m) => [msg, ...m]);
      } finally {
        setIsTyping(false);
      }
    },
    [isTyping, sector]
  );

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.aiIcon}>
            <Ionicons name="layers-outline" size={18} color={colors.accentBlue} />
          </View>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>RAG Assistant</Text>
            <Text style={styles.headerSub}>{uploadStatus}</Text>
            <Text style={styles.headerSub}>API: {baseUrl}</Text>
          </View>
        </View>
      </View>

      <View style={styles.toolsRow}>
        <TextInput
          value={sector}
          onChangeText={setSector}
          placeholder="Sector (optional)"
          placeholderTextColor={colors.faint}
          style={styles.sectorInput}
          autoCapitalize="none"
        />
        <Pressable onPress={pickAndUpload} style={styles.uploadBtn}>
          <Ionicons name="cloud-upload-outline" size={18} color={colors.text} />
          <Text style={styles.uploadBtnText}>Upload PDF</Text>
        </Pressable>
      </View>

      <FlatList
        data={messages}
        inverted
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <Bubble role={item.role} text={item.text} sources={item.sources} />}
        ListHeaderComponent={isTyping ? <TypingRow /> : null}
        keyboardShouldPersistTaps="handled"
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.composer, { paddingBottom: 14 + (insets?.bottom || 0) }]}>
          <View style={styles.inputWrap}>
            <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.faint} />
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Ask a question from your PDFs..."
              placeholderTextColor={colors.faint}
              style={styles.input}
              multiline
              maxLength={1200}
              returnKeyType="send"
              onSubmitEditing={() => send(input)}
              blurOnSubmit
            />
          </View>
          <Pressable
            onPress={() => send(input)}
            disabled={!input.trim() || isTyping}
            style={({ pressed }) => [
              styles.sendBtn,
              (!input.trim() || isTyping) && styles.sendBtnDisabled,
              pressed && input.trim() && !isTyping && { transform: [{ scale: 0.98 }] },
            ]}
          >
            <Ionicons name="send" size={18} color={colors.text} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function TypingRow() {
  return (
    <View style={[styles.bubble, styles.aiBubble]}>
      <TypingDots />
    </View>
  );
}

function Bubble({ role, text, sources }) {
  const isUser = role === 'user';
  return (
    <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
      <Text selectable style={[styles.bubbleText, isUser ? styles.userText : styles.aiText]}>
        {text}
      </Text>
      {!isUser && Array.isArray(sources) && sources.length ? (
        <View style={styles.sourcesWrap}>
          <Text style={styles.sourcesTitle}>Sources</Text>
          {sources.map((s, idx) => (
            <SourceRow key={`${idx}_${s?.filePath || ''}`} source={s} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function SourceRow({ source }) {
  const pdfName = String(source?.pdfName || '');
  const page = Number(source?.page || 0);
  const sector = String(source?.sector || '');
  const filePath = String(source?.filePath || '');

  const url = filePathToDownloadUrl(filePath);

  const open = async () => {
    if (!url) return;
    const can = await Linking.canOpenURL(url);
    if (can) await Linking.openURL(url);
  };

  return (
    <View style={styles.sourceRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.sourceText} numberOfLines={1}>
          {pdfName || 'PDF'}
        </Text>
        <Text style={styles.sourceMeta} numberOfLines={1}>
          Page: {page || '-'} {sector ? `| Sector: ${sector}` : ''}
        </Text>
      </View>
      <Pressable onPress={open} disabled={!url} style={[styles.openBtn, !url && styles.openBtnDisabled]}>
        <Ionicons name="document-outline" size={16} color={colors.text} />
        <Text style={styles.openBtnText}>{url ? 'Open' : 'No URL'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
    backgroundColor: colors.glass2,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 },
  headerTitleWrap: { flex: 1, minWidth: 0 },
  aiIcon: {
    height: 38,
    width: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(79,211,255,0.26)',
    backgroundColor: 'rgba(79,211,255,0.10)',
  },
  headerTitle: { color: colors.text, fontWeight: '900', fontSize: 16, includeFontPadding: false },
  headerSub: { color: colors.muted, fontWeight: '700', fontSize: 12, marginTop: 3, includeFontPadding: false },

  toolsRow: {
    paddingHorizontal: 18,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectorInput: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glass2,
    paddingHorizontal: 12,
    color: colors.text,
    fontWeight: '700',
  },
  uploadBtn: {
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.accentBlue,
    shadowColor: colors.accentBlue,
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  uploadBtnText: { color: colors.text, fontWeight: '900', includeFontPadding: false },

  list: { paddingHorizontal: 18, paddingBottom: 10 },
  bubble: { maxWidth: '92%', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 16, marginVertical: 6, borderWidth: 1 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: 'rgba(43,255,155,0.10)', borderColor: 'rgba(43,255,155,0.22)' },
  aiBubble: { alignSelf: 'flex-start', backgroundColor: colors.glass2, borderColor: colors.glassBorder },
  bubbleText: { fontSize: 13.5, lineHeight: 18 },
  userText: { color: colors.text, fontWeight: '700' },
  aiText: { color: colors.text, fontWeight: '600' },

  sourcesWrap: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border },
  sourcesTitle: { color: colors.muted, fontWeight: '900', fontSize: 12, marginBottom: 6 },
  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  sourceText: { color: colors.text, fontWeight: '900', fontSize: 12.5 },
  sourceMeta: { color: colors.muted, fontWeight: '700', fontSize: 11.5, marginTop: 2 },
  openBtn: {
    height: 34,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  openBtnDisabled: { opacity: 0.5 },
  openBtnText: { color: colors.text, fontWeight: '900', fontSize: 12 },

  composer: { paddingHorizontal: 18, paddingBottom: 14, flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  inputWrap: { flex: 1, minHeight: 48, borderRadius: 16, borderWidth: 1, borderColor: colors.glassBorder, backgroundColor: colors.glass2, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  input: { flex: 1, color: colors.text, fontSize: 14, fontWeight: '600', padding: 0, margin: 0, maxHeight: 120 },
  sendBtn: { height: 48, width: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentBlue },
  sendBtnDisabled: { backgroundColor: 'rgba(64,201,255,0.25)' },
});
