export async function onRequestPost({ request, env }) {
  const body = await request.json();
  const raw = await env.CHAT_STORE.get("global_chat_stream");
  let messages = raw ? JSON.parse(raw) : [];

  if (body.type === "msg") {
    messages.push({
      id: crypto.randomUUID(),
      user: body.user,
      avatar: body.avatar,
      text: body.text || "",
      image: body.image || null,
      replyTo: body.replyTo || null,
      reactions: {},
      timestamp: Date.now()
    });
  } else if (body.type === "react") {
    const msg = messages.find(m => m.id === body.msgId);

    if (msg) {
      if (!msg.reactions[body.emoji]) {
        msg.reactions[body.emoji] = [];
      }

      const idx = msg.reactions[body.emoji].indexOf(body.user);

      if (idx > -1) {
        msg.reactions[body.emoji].splice(idx, 1);
      } else {
        msg.reactions[body.emoji].push(body.user);
      }
    }
  }

  if (messages.length > 30) {
    messages.shift();
  }

  await env.CHAT_STORE.put(
    "global_chat_stream",
    JSON.stringify(messages)
  );

  return new Response(
    JSON.stringify({ success: true }),
    {
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
}