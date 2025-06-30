import { Glob, pathToFileURL } from "bun";
import { Hono } from "hono";
import { telefunc, config } from "telefunc";
import { cors } from "hono/cors";

const telefuncFiles = new Glob("src/**/*.telefunc.ts");

const functions = [];
for await (const file of telefuncFiles.scan(".")) {
   functions.push(require.resolve(pathToFileURL(file).toString()));
}

// Telefunc configuration
config.telefuncFiles = functions;
config.disableNamingConvention = true;
console.log(pathToFileURL("../").toString())
config.root = pathToFileURL("../").toString().replace("file:///", "");
const app = new Hono();

app.use("/_telefunc", cors())

app.post("/_telefunc", async (c) => {
  const httpResponse = await telefunc({
    url: c.req.url.toString(),
    method: c.req.method,
    body: await c.req.text(),
    context: {
      honoContext: c,
    },
  });
  const { body, statusCode, contentType } = httpResponse;
  return new Response(body, {
    status: statusCode,
    headers: {
      "content-type": contentType,
    },
  });
});

export default app;
