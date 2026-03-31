import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

import Screen from '../components/Screen';
import TypingDots from '../components/TypingDots';
import { askAi, getApiBaseUrl } from '../services/ai';
import { colors } from '../theme/colors';

const SUGGESTIONS = ['How to join NDA?', 'Eligibility for CDS?', 'Best defence career for me?'];

export default function AiChatScreen({ route }) {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState(() => [
    {
      id: 'm0',
      role: 'ai',
      text: "Hi! Welcome to Spark Future Leaders Academy (Obul Reddy School). Ask me anything about NDA, CDS, AFCAT, Agniveer, preparation, fitness, and more.",
    },
  ]);

  const abortRef = useRef(null);
  const prefilledRef = useRef(null);
  const autoSentRef = useRef(null);
  const baseUrl = useMemo(() => getApiBaseUrl(), []);
  const isDefaultLocalhost = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');
  const showApiHints = false;

  const send = useCallback(
    async (prompt) => {
      const clean = String(prompt || '').trim();
      if (!clean || isTyping) return;

      const userMsg = { id: `u_${Date.now()}`, role: 'user', text: clean };
      setMessages((m) => [userMsg, ...m]);
      setInput('');
      setIsTyping(true);

      try {
        abortRef.current?.abort?.();
        abortRef.current = new AbortController();
        const text = await askAi(clean, { signal: abortRef.current.signal });
        const aiMsg = { id: `a_${Date.now()}`, role: 'ai', text };
        setMessages((m) => [aiMsg, ...m]);
      } catch (e) {
        const msg = {
          id: `e_${Date.now()}`,
          role: 'ai',
          text: `I couldn't reach /ai. Set EXPO_PUBLIC_API_BASE_URL to your backend URL.\n\nError: ${e?.message || 'Unknown error'}`,
        };
        setMessages((m) => [msg, ...m]);
      } finally {
        setIsTyping(false);
      }
    },
    [isTyping]
  );

  useEffect(() => {
    const initialPrompt = route?.params?.initialPrompt;
    if (!initialPrompt) return;
    if (prefilledRef.current === initialPrompt) return;
    prefilledRef.current = initialPrompt;
    setInput((current) => (String(current || '').trim().length ? current : initialPrompt));
  }, [route?.params?.initialPrompt]);

  useEffect(() => {
    const initialPrompt = route?.params?.initialPrompt;
    const autoSend = route?.params?.autoSend === true;
    if (!autoSend || !initialPrompt) return;
    if (autoSentRef.current === initialPrompt) return;
    autoSentRef.current = initialPrompt;
    send(initialPrompt);
  }, [route?.params?.autoSend, route?.params?.initialPrompt, send]);

  useEffect(() => () => abortRef.current?.abort?.(), []);

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.aiIcon}>
            <Ionicons name="sparkles" size={18} color={colors.accentBlue} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Spark Future Leaders Academy</Text>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Obul Reddy School</Text>
            </View>
          </View>
        </View>
        {showApiHints ? (
          <View style={styles.baseUrlPill}>
            <Ionicons name="server-outline" size={14} color={colors.muted} />
            <Text numberOfLines={1} style={styles.baseUrlText}>
              {baseUrl}
            </Text>
          </View>
        ) : null}
      </View>

      {showApiHints && isDefaultLocalhost ? (
        <View style={styles.banner}>
          <Ionicons name="information-circle-outline" size={16} color={colors.accentOrange} />
          <Text style={styles.bannerText}>
            On a real device, localhost won't reach your PC. Set `EXPO_PUBLIC_API_BASE_URL` to your backend LAN URL.
          </Text>
        </View>
      ) : null}

      <FlatList
        data={messages}
        inverted
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <Bubble role={item.role} text={item.text} />}
        ListHeaderComponent={isTyping ? <TypingRow /> : null}
        keyboardShouldPersistTaps="handled"
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.suggestions}>
          {SUGGESTIONS.map((s) => (
            <Pressable key={s} onPress={() => send(s)} style={styles.suggestionChip}>
              <Text numberOfLines={1} style={styles.suggestionText}>
                {s}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.composer}>
          <View style={styles.inputWrap}>
            <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.faint} />
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Ask about NDA, CDS, AFCAT, Agniveer..."
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

function Bubble({ role, text }) {
  const isUser = role === 'user';
  const displayText = isUser ? text : sanitizeAiText(text);
  return (
    <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
      <Text selectable style={[styles.bubbleText, isUser ? styles.userText : styles.aiText]}>
        {displayText}
      </Text>
    </View>
  );
}

function sanitizeAiText(input) {
  const s = String(input || '');
  return (
    s
      // headings: ### Title -> Title
      .replace(/^#{1,6}\s+/gm, '')
      // bold/italic markers
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      // inline code markers
      .replace(/`([^`]+)`/g, '$1')
      // horizontal rules
      .replace(/^\s*---+\s*$/gm, '')
      // unordered lists
      .replace(/^\s*[-*]\s+/gm, 'â€¢ ')
      // trim excessive blank lines
      .replace(/\n{3,}/g, '\n\n')
      .trim()
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
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  aiIcon: {
    height: 38,
    width: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(64,201,255,0.24)',
    backgroundColor: 'rgba(64,201,255,0.10)',
  },
  headerTitle: { color: colors.text, fontWeight: '900', fontSize: 16 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  statusDot: { height: 7, width: 7, borderRadius: 999, backgroundColor: colors.accentGreen },
  statusText: { color: colors.muted, fontWeight: '700', fontSize: 12 },
  baseUrlPill: {
    maxWidth: 170,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  baseUrlText: { color: colors.muted, fontSize: 11.5, fontWeight: '700' },
  banner: {
    marginHorizontal: 18,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,122,0,0.28)',
    backgroundColor: 'rgba(255,122,0,0.08)',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bannerText: { color: colors.muted, fontWeight: '600', fontSize: 12.5, lineHeight: 17, flex: 1 },
  list: { paddingHorizontal: 18, paddingBottom: 10 },
  bubble: { maxWidth: '86%', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 16, marginVertical: 6, borderWidth: 1 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: 'rgba(45,255,149,0.10)', borderColor: 'rgba(45,255,149,0.22)' },
  aiBubble: { alignSelf: 'flex-start', backgroundColor: colors.card2, borderColor: colors.border },
  bubbleText: { fontSize: 13.5, lineHeight: 18 },
  userText: { color: colors.text, fontWeight: '700' },
  aiText: { color: colors.text, fontWeight: '600' },
  suggestions: { flexDirection: 'row', gap: 8, paddingHorizontal: 18, paddingBottom: 10 },
  suggestionChip: { flex: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: 'rgba(255,255,255,0.03)' },
  suggestionText: { color: colors.muted, fontWeight: '700', fontSize: 12 },
  composer: { paddingHorizontal: 18, paddingBottom: 14, flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  inputWrap: { flex: 1, minHeight: 48, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  input: { flex: 1, color: colors.text, fontSize: 14, fontWeight: '600', padding: 0, margin: 0, maxHeight: 120 },
  sendBtn: { height: 48, width: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentBlue, shadowColor: colors.accentBlue, shadowOpacity: 0.28, shadowRadius: 12, shadowOffset: { width: 0, height: 10 }, elevation: 10 },
  sendBtnDisabled: { backgroundColor: 'rgba(64,201,255,0.25)', shadowOpacity: 0, elevation: 0 },
});

