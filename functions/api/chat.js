export async function onRequest(context) {
  const { request, env } = context;
  const upgradeHeader = request.headers.get("Upgrade");
  
  if (upgradeHeader !== "websocket") {
    return new Response("Expected websocket", { status: 426 });
  }

  const [client, server] = Object.values(new WebSocketPair());
  server.accept();

  // Here you can add logic to handle messages and connect to your CHAT_STORE

  return new Response(null, {
    status: 101,
    webSocket: client,
  });
}
