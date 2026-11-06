# Blog Automation with n8n, Docker, and Ollama Cloud

This document explains how to automate blog creation for this app using local n8n in Docker and `gemma4:31b-cloud` through Ollama. The recommended setup generates blog drafts automatically, saves them into the app, and keeps admin approval before publishing.

Sources checked:

- n8n Docker docs: https://docs.n8n.io/hosting/installation/docker/
- n8n Docker Compose docs: https://docs.n8n.io/hosting/installation/server-setups/docker-compose/
- Ollama Cloud docs: https://docs.ollama.com/cloud
- Ollama OpenAI compatibility docs: https://docs.ollama.com/openai
- Gemma 4 Ollama model page: https://ollama.com/library/gemma4

## Target Architecture

Use this workflow:

```text
Google Sheet keywords
  -> n8n Schedule Trigger
  -> n8n splits 20 topics/day
  -> Ollama gemma4:31b-cloud generates structured blog JSON
  -> optional quality-check step
  -> n8n logs in to this app as admin
  -> n8n POSTs each article to /api/blogs as draft
  -> admin reviews and publishes from the existing blog admin UI
```

Do not auto-publish at first. Generate 20 drafts/day, then publish only the best posts after review.

## Prerequisites

Install these locally:

- Docker Desktop
- Ollama
- Node/npm app running locally at `http://localhost:3000`
- Valid admin user for this app
- n8n running at `http://localhost:5678`
- Google Sheet or Airtable table for blog keywords

Ollama cloud models require an Ollama account. Sign in once on the host machine:

```bash
ollama signin
ollama pull gemma4:31b-cloud
ollama run gemma4:31b-cloud
```

Test local Ollama API:

```bash
curl http://localhost:11434/api/chat \
  -d '{
    "model": "gemma4:31b-cloud",
    "messages": [
      { "role": "user", "content": "Write one sentence about Bangalore real estate." }
    ],
    "stream": false
  }'
```

From inside the n8n Docker container, use `host.docker.internal` instead of `localhost`:

```text
http://host.docker.internal:11434/api/chat
http://host.docker.internal:3000/api/blogs
```

## Run n8n Locally with Docker

Use this simple local setup first:

```bash
docker volume create n8n_data

docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -e GENERIC_TIMEZONE="Asia/Kolkata" \
  -e TZ="Asia/Kolkata" \
  -e N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=true \
  -e N8N_RUNNERS_ENABLED=true \
  -v n8n_data:/home/node/.n8n \
  docker.n8n.io/n8nio/n8n
```

Open:

```text
http://localhost:5678
```

For longer-term use, create a `docker-compose.yml` outside this repo or in a private ops folder:

```yaml
services:
  n8n:
    image: docker.n8n.io/n8nio/n8n:stable
    restart: unless-stopped
    ports:
      - "5678:5678"
    environment:
      - GENERIC_TIMEZONE=Asia/Kolkata
      - TZ=Asia/Kolkata
      - N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=true
      - N8N_RUNNERS_ENABLED=true
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=change-this-password
    volumes:
      - n8n_data:/home/node/.n8n

volumes:
  n8n_data:
```

Start it:

```bash
docker compose up -d
```

## Prepare Keyword Sheet

Create a Google Sheet named `Blog Automation Queue` with these columns:

```text
id
keyword
city
location
propertyType
category
intent
priority
status
notes
draftUrl
error
createdAt
processedAt
```

Recommended status values:

```text
queued
processing
draft_created
failed
approved
published
skipped
```

Example rows:

```text
1 | flats in Sarjapur Road | Bangalore | Sarjapur Road | Apartment | Buying Guide | buyer | high | queued
2 | ready to move flats in Whitefield | Bangalore | Whitefield | Apartment | Location Guide | buyer | high | queued
3 | villa plots near Devanahalli | Bangalore | Devanahalli | Plot | Investment | investor | medium | queued
```

## n8n Workflow Nodes

Create this workflow in n8n.

### 1. Schedule Trigger

Run once daily, for example:

```text
Every day at 07:00 Asia/Kolkata
```

### 2. Google Sheets: Read Rows

Read rows where:

```text
status = queued
```

Sort or filter by:

```text
priority = high first
limit = 20
```

### 3. Split in Batches

Set batch size:

```text
1
```

This avoids sending 20 heavy generation requests at the same time.

### 4. Set Node: Build Prompt Variables

Create fields:

```text
targetKeyword
city
location
propertyType
category
intent
brandName = PropFinova
siteUrl = https://propfinova.com
```

### 5. HTTP Request: Generate Blog with Ollama

Use:

```text
Method: POST
URL: http://host.docker.internal:11434/api/chat
Content-Type: JSON
```

Body:

```json
{
  "model": "gemma4:31b-cloud",
  "stream": false,
  "format": "json",
  "options": {
    "temperature": 0.7,
    "top_p": 0.9
  },
  "messages": [
    {
      "role": "system",
      "content": "You are an expert real estate SEO writer for PropFinova. Return only valid JSON. Do not use markdown fences. Write useful, locally specific, non-spammy content. Avoid fake price claims, fake legal claims, and unsupported guarantees."
    },
    {
      "role": "user",
      "content": "Create a real estate blog for keyword: {{$json.targetKeyword}}. City: {{$json.city}}. Location: {{$json.location}}. Property type: {{$json.propertyType}}. Category: {{$json.category}}. Intent: {{$json.intent}}. Return JSON with keys: title, excerpt, contentHtml, categories, tags, seo. seo must include metaTitle, metaDescription, keywords. Rules: metaTitle max 60 chars, metaDescription max 160 chars, excerpt max 300 chars, contentHtml must be HTML with h2/h3/p/ul/li tags, 1200-1800 words, include FAQs near the end, include a natural PropFinova CTA, no duplicate title pattern."
    }
  ]
}
```

Expected JSON inside Ollama response:

```json
{
  "title": "Best Flats in Sarjapur Road for Home Buyers",
  "excerpt": "Short summary under 300 characters.",
  "contentHtml": "<h2>...</h2><p>...</p>",
  "categories": ["Buying Guide"],
  "tags": ["Sarjapur Road", "Bangalore", "Flats"],
  "seo": {
    "metaTitle": "Flats in Sarjapur Road: Buyer Guide",
    "metaDescription": "Explore flats in Sarjapur Road with location, connectivity, lifestyle, and buyer tips.",
    "keywords": ["flats in Sarjapur Road", "Sarjapur Road apartments", "Bangalore real estate"]
  }
}
```

Important: Ollama’s `/api/chat` usually returns generated text under:

```text
response.body.message.content
```

In n8n, add a Code node after this step to parse that JSON string.

### 6. Code Node: Parse and Clean Output

Use this JavaScript:

```javascript
const raw = $json.message?.content || $json.response || '';
let blog;

try {
  blog = JSON.parse(raw);
} catch (error) {
  throw new Error(`Model returned invalid JSON: ${raw.slice(0, 500)}`);
}

function trimTo(value, max) {
  return String(value || '').trim().slice(0, max);
}

return [{
  json: {
    title: trimTo(blog.title, 120),
    excerpt: trimTo(blog.excerpt, 300),
    content: String(blog.contentHtml || '').trim(),
    categories: Array.isArray(blog.categories) ? blog.categories : [],
    tags: Array.isArray(blog.tags) ? blog.tags : [],
    seo: {
      metaTitle: trimTo(blog.seo?.metaTitle || blog.title, 60),
      metaDescription: trimTo(blog.seo?.metaDescription || blog.excerpt, 160),
      keywords: Array.isArray(blog.seo?.keywords) ? blog.seo.keywords : []
    },
    status: 'draft'
  }
}];
```

### 7. Optional HTTP Request: Quality Check with Ollama

Add a second Ollama call that reviews the draft and returns:

```json
{
  "approved": true,
  "score": 82,
  "issues": [],
  "needsHumanReview": false
}
```

Reject or mark `failed` if:

- score below 70
- content below 900 words
- missing location
- duplicate title
- invalid meta fields
- unsupported financial/legal claims

### 8. HTTP Request: Login to App

Use this app’s existing login API:

```text
Method: POST
URL: http://host.docker.internal:3000/api/auth/login
Content-Type: JSON
```

Body:

```json
{
  "email": "YOUR_ADMIN_EMAIL",
  "password": "YOUR_ADMIN_PASSWORD"
}
```

The response contains:

```text
token
```

Store admin email/password in n8n credentials or environment variables. Do not hardcode them in the workflow.

### 9. HTTP Request: Create Blog Draft

Use this app’s current blog API:

```text
Method: POST
URL: http://host.docker.internal:3000/api/blogs
Content-Type: JSON
Authorization: Bearer {{$node["Login to App"].json["token"]}}
```

Body:

```json
{
  "title": "{{$json.title}}",
  "content": "{{$json.content}}",
  "excerpt": "{{$json.excerpt}}",
  "featuredImage": null,
  "categories": "{{$json.categories}}",
  "tags": "{{$json.tags}}",
  "seo": "{{$json.seo}}",
  "status": "draft"
}
```

The blog model requires:

- `title`
- `content`
- `excerpt`
- `seo.metaTitle`
- `seo.metaDescription`

The API automatically creates a unique slug and sets the authenticated admin as author.

### 10. Google Sheets: Update Row

After a successful draft:

```text
status = draft_created
draftUrl = /admin/blogs
processedAt = current date/time
error = empty
```

After failure:

```text
status = failed
error = error message
processedAt = current date/time
```

## Publishing Strategy

Start with this rule:

```text
Generate 20 drafts/day.
Manually publish 3-8 best posts/day.
Do not auto-publish until quality is proven for at least 2 weeks.
```

Why:

- 20 low-quality posts/day can hurt SEO.
- Real estate content needs local accuracy.
- Repetitive AI pages can look spammy.
- Admin approval protects the brand.

Later, add auto-publish only for drafts that pass quality score, uniqueness check, and required keyword/location checks.

## Recommended Prompt Rules

Use these rules in every generation prompt:

- Write for real home buyers and investors, not search engines only.
- Mention the location naturally.
- Include practical details: connectivity, nearby employment hubs, schools, hospitals, lifestyle, buyer checklist, pros/cons.
- Do not invent exact prices unless provided by a trusted data source.
- Do not make legal, loan, or investment guarantees.
- Avoid repeating the same opening paragraph across posts.
- Add internal link placeholders where useful.
- End with a soft PropFinova CTA.

## Image Handling

Start simple:

- Keep `featuredImage` as `null`, or
- Use a manually selected image URL, or
- Add a later n8n step to generate/upload images.

The app already supports blog image upload through:

```text
POST /api/upload/blog-image
```

That route needs admin authorization and multipart form upload. Add this only after text automation is stable.

## Safety and SEO Quality Checklist

Before publishing any draft, check:

- Title is not duplicated.
- Meta title is under 60 characters.
- Meta description is under 160 characters.
- Excerpt is under 300 characters.
- Content is useful and locally specific.
- No fake pricing, fake RERA claims, fake builder claims, or legal guarantees.
- No copied competitor content.
- Blog has headings, FAQs, and a clear CTA.
- Blog links to relevant property/search pages where possible.

## Common Problems and Fixes

### n8n Cannot Reach Ollama

Use this URL inside Docker:

```text
http://host.docker.internal:11434/api/chat
```

Do not use `http://localhost:11434` from inside the n8n container.

### n8n Cannot Reach the Next.js App

Use:

```text
http://host.docker.internal:3000
```

Make sure the app is running:

```bash
npm run dev
```

### Invalid Blog API Response

Check that the payload includes:

```text
title
content
excerpt
seo.metaTitle
seo.metaDescription
```

Also check that the admin login token is being sent:

```text
Authorization: Bearer <token>
```

### Model Returns Invalid JSON

Add:

```json
"format": "json"
```

Keep the system prompt strict:

```text
Return only valid JSON. Do not use markdown fences.
```

Also keep the Code node error handling so failed rows are marked `failed` instead of silently creating bad posts.

## Future Improvements

After the first working version:

1. Add duplicate topic detection before generation.
2. Add automatic internal links to property pages and location pages.
3. Add a blog review queue in the app.
4. Add scheduled publishing support to the Blog model.
5. Add a sitemap ping/update step after publishing.
6. Add Google Search Console performance feedback into the keyword sheet.
7. Add a second model pass to improve only low-scoring drafts.

## Final Recommended Setup

Use n8n as the automation engine, Ollama `gemma4:31b-cloud` as the writer, Google Sheets as the topic queue, and this app’s `/api/blogs` endpoint as the draft destination.

Run the system in draft-only mode first. Once quality is stable, add scheduled publishing and stronger SEO checks.
