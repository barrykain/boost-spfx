# Boost Assistant SPFx Extension

This project is a SharePoint Framework (SPFx) **Application Customizer** that injects the **Boost.ai** chat panel into modern SharePoint Online pages.

It supports three configurable properties:

* **`boostTenant`** – Boost subdomain (e.g., `ccontoso` → `https://contoso.boost.ai`)
* **`autoOpen`** – Automatically open the panel after it loads (default: `true`)
* **`boostOptionsJson`** – JSON string passed as the second parameter to `window.boostInit(tenant, options)` (e.g., position, locale, action filters)

---

## Prerequisites

* **Node.js**: 22.x LTS
* **Gulp CLI** (global): `npm i -g gulp-cli`
* **Yeoman** (global): `npm i -g yo`
* **SPFx Generator**: `npm i -g @microsoft/generator-sharepoint@1.21.1`

> Ensure your SharePoint Online domain is allowed in Boost.ai CORS/Allowed Origins. If your tenant enforces CSP for scripts, allow `*.boost.ai`.

---

## Getting Started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Local debug (hosted workbench)**

   ```bash
   gulp serve
   ```

   Open the hosted workbench (replace tenant/site):

   ```
   https://<tenant>.sharepoint.com/sites/<site>/_layouts/15/workbench.aspx?loadSPFX=true&debugManifestsFile=https://localhost:4321/temp/build/manifests.js
   ```

3. **Attach the Application Customizer (debug)**
   Append a `customActions` query string with your component GUID and properties. Example (unencoded for readability):

   ```
   &customActions={"<COMPONENT_GUID>":{"location":"ClientSideExtension.ApplicationCustomizer","properties":{"boostTenant":"contoso","autoOpen":true,"boostOptionsJson":"{\"chatPanel\":{\"position\":\"right\",\"locale\":\"en\",\"actionFilters\":[\"boostfilter1\"]}}"}}}
   ```

   > URL-encode the entire `customActions=` JSON in real usage to avoid 404s.

---

## Configuration

### Properties

| Property           | Type      | Required | Default | Description                                                    |
| ------------------ | --------- | -------: | :-----: | -------------------------------------------------------------- |
| `boostTenant`      | `string`  |      Yes |    —    | Boost subdomain (e.g., `contoso` → `https://contoso.boost.ai`) |
| `autoOpen`         | `boolean` |       No |  `true` | Open the panel immediately after initialization                |
| `boostOptionsJson` | `string`  |       No |   `{}`  | JSON string passed to `boostInit(tenant, options)`             |

**Examples for `boostOptionsJson`:**

* Force position + locale:

  ```json
  {"chatPanel":{"position":"right","locale":"en"}}
  ```
* Enforce a conversation filter:

  ```json
  {"chatPanel":{"actionFilters":["boostfilter1"]}}
  ```
* Combine options:

  ```json
  {"chatPanel":{"position":"right","locale":"en","actionFilters":["boostfilter1"]}}
  ```

> Keep `boostOptionsJson` for runtime/UI options only—never place secrets there.

---

## Where to Set Properties

### A) Tenant-Wide Extensions (recommended for production)

After uploading/deploying the `.sppkg` in the App Catalog:

* **App Catalog → Tenant Wide Extensions → Add/Configure**
* Set **Properties** JSON (example):

  ```json
  {
    "boostTenant": "contoso",
    "autoOpen": true,
    "boostOptionsJson": "{\"chatPanel\":{\"position\":\"right\",\"locale\":\"en\"}}"
  }
  ```

### B) Site-Scoped (Custom Action XML)

If you install the app on specific sites, use `sharepoint/assets/elements.xml`:

```xml
<Elements xmlns="http://schemas.microsoft.com/sharepoint/">
  <CustomAction
    Title="Boost Assistant"
    Location="ClientSideExtension.ApplicationCustomizer"
    ClientSideComponentId="REPLACE-COMPONENT-GUID">
    <ClientSideComponentProperties>
      { "boostTenant": "contoso",
        "autoOpen": true,
        "boostOptionsJson": "{\"chatPanel\":{\"position\":\"right\",\"locale\":\"en\"}}" }
    </ClientSideComponentProperties>
  </CustomAction>
</Elements>
```

Replace `REPLACE-COMPONENT-GUID` with the `"id"` from your extension manifest.

### C) Hosted Workbench (debug only)

Use `customActions` in the workbench URL (URL-encoded). See **Getting Started** → step 3.

---

## How to Find the Component GUID

Open:

```
src/extensions/<your-folder>/BoostAssistantApplicationCustomizer.manifest.json
```

Use the `"id"` value as `<COMPONENT_GUID>` for debugging URLs or `elements.xml`.

---

## Build, Package, Deploy

1. **Build for production**

   ```bash
   gulp bundle --ship
   gulp package-solution --ship
   ```
2. **Upload & deploy**

   * Upload `sharepoint/solution/<solution>.sppkg` to the **App Catalog**
   * **Deploy** (tenant-wide or install on specific sites)
3. **Set properties**

   * **Tenant-Wide Extensions** or **site-scoped** (XML/UI)

---

## Project Structure

```
src/
  extensions/
    <your-folder>/
      BoostAssistantApplicationCustomizer.ts
      BoostAssistantApplicationCustomizer.manifest.json
config/
  package-solution.json
  serve.json
sharepoint/
  assets/
    elements.xml
    feature.xml
```

* **BoostAssistantApplicationCustomizer.ts** – loads `https://<boostTenant>.boost.ai/chatPanel/chatPanel.js`, calls `window.boostInit(tenant, options)`, and (optionally) `boost.chatPanel.show()` if `autoOpen` is `true`.
* **serve.json** – hosted workbench config; uses `debugManifestsFile=https://localhost:4321/temp/build/manifests.js`.

---

## Troubleshooting

* **Panel doesn’t appear**

  * Confirm `boostTenant` is set correctly and CORS allows your SPO domain in Boost.
  * Check the browser console for CSP violations (`*.boost.ai` must be allowed if CSP is enforced).
  * Ensure `gulp serve` is running and the workbench URL points to `/temp/build/manifests.js` (or `/temp/manifests.js` in some setups).

* **404 after adding `customActions`**

  * The JSON likely isn’t URL-encoded. Encode the entire `customActions=` value.

* **“Task never defined: serve”**

  * Ensure `@microsoft/sp-build-web@1.21.1` is installed and `gulpfile.js` initializes:

    ```js
    'use strict';
    const build = require('@microsoft/sp-build-web');
    build.initialize(require('gulp'));
    ```

* **TypeScript/tooling mismatch**

  * Use `@microsoft/rush-stack-compiler-5.3@0.1.0` with `typescript@~5.3.3` and set:

    ```json
    { "extends": "./node_modules/@microsoft/rush-stack-compiler-5.3/includes/tsconfig-web.json" }
    ```

---

## Security Notes

* **CORS**: Only load the widget on origins allowed in Boost.
* **CSP**: If enabled in your tenant, add `*.boost.ai` to allowed script sources.
* **Privacy**: Avoid logging sensitive data (e.g., raw group names) if you later add group-based routing.

---

## License

MIT (or your organization’s standard).
