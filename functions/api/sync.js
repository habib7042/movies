export async function onRequestGet(context) {
  const { env } = context;

  const messagesRaw = await env.CHAT_STORE.get("global_chat_stream");
  const typingRaw = await env.CHAT_STORE.get("global_typing_stream");

  return new Response(
    JSON.stringify({
      messages: messagesRaw ? JSON.parse(messagesRaw) : [],
      typing: typingRaw ? JSON.parse(typingRaw) : {}
    }),
    {
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
}

}