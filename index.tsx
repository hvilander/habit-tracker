import {type Context, Hono} from 'hono';
import { serveStatic } from 'hono/bun';
import { neon } from "@neondatabase/serverless";


console.log("Bun server starting...");
const app = new Hono();

console.log("starting db connection...");
if (!process.env.DB_URL) {
  throw new Error("malformed DB_URL env var");
}

const sql = neon(process.env.DB_URL);

const rows = await sql`SELECT version()`;
console.log(rows[0].version);

// Serve static files from public directory
app.use('/*', serveStatic({root: './public'}));

app.get('/version', (c: Context) => {
  console.log("getting version");
  //return a response whose body contains the bun version
  return c.text('v' + Bun.version);
});

app.get('/people', async (c: Context) => {
  console.log("getting people");
  const rows = await sql`SELECT fname, lname from people`;
  return c.html(
    <ul>
      {rows.map(({fname, lname}) => <li>{fname + ' ' + lname}</li>)}
    </ul>
  );
});

app.post('/people', async (c: Context) => {
  let body: FormData;
  let created;
  try{
    body = await c.req.formData();
    const fname = body.get('fname');
    const lname = body.get('lname');
    created = await sql`
      INSERT INTO people (fname, lname) values (${fname}, ${lname});
    `;
  } catch (error) {
    console.error(error);
  }

  c.res = new Response('success', {
    status: 200,
    headers: {
      'X-message': 'success',
    },
  });

  console.log(created)
  return c.res;
})

export default app;
