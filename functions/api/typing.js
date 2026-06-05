export async function onRequestPost(context) {
      const { request, env } = context;
        const body = await request.json();
          const typingRaw = await env.CHAT_STORE.get("global_typing_stream");
            let typers = typingRaw ? JSON.parse(typingRaw) : {};

              if (body.isTyping) {
                  typers[body.user] = Date.now();
                    } else {
                        delete typers[body.user];
                          }

                            const now = Date.now();
                              Object.keys(typers).forEach(u => {
                                  if (now - typers[u] > 3000) delete typers[u];
                                    });

                                      await env.CHAT_STORE.put("global_typing_stream", JSON.stringify(typers));
                                        return new Response("OK");
                                        }
                                        
}