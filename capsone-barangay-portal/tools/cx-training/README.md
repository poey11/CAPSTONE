# Dialogflow CX Training Kit (VS Code)

A ready-to-use project to **train and manage** your Dialogflow CX agent from files in VS Code. It gives you:

* **Data → NLU**: Entities (@doc\_base, @doc\_variant) + training phrases generated from your lists.
* **Replies from files**: Service requirements & incident answers kept in JSON/MD and consumed by your webhook/frontend.
* **Sync scripts**: TypeScript scripts to **create/update CX entities & intents** via API.
* **Single source of truth** you can version-control.

> You already provided Parts 1–6. They’re embedded below in `/data` files.

---

## 1) Setup

1. **Create a GCP service account** with `Dialogflow API Client` and `Dialogflow API Admin`.
2. **Enable** Dialogflow API for your project.
3. **Auth** (choose one):

   * `gcloud auth application-default login`, or
   * Download a JSON key and set `GOOGLE_APPLICATION_CREDENTIALS`.
4. In VS Code terminal:

   ```bash
   npm i
   cp .env.example .env
   # Fill .env: PROJECT_ID, LOCATION, AGENT_ID, LANGUAGE_CODE
   ```

**Run** (in order):

```bash
npm run sync:entities    # creates/updates @doc_base and @doc_variant
npm run sync:intents     # seeds core intents (request service, reqs, incident info)
npm run build:replies    # validates & bundles replies into dist/replies.compiled.json
```

> Your existing `/api/dialogflow` can read `dist/replies.compiled.json` to craft messages using captured params (doc\_base/doc\_variant), or you can keep responses inside CX pages—your choice.

---

## 2) Project layout

```
.
├─ src/
│  ├─ cx/
│  │  ├─ auth.ts
│  │  ├─ syncEntities.ts
│  │  └─ syncIntents.ts
│  ├─ buildReplies.ts
│  └─ utils.ts
├─ data/
│  ├─ entities/
│  │  ├─ doc_bases.json
│  │  └─ doc_variants_by_base.json
│  ├─ replies/
│  │  ├─ services.json
│  │  ├─ incidents.md
│  │  └─ navigation.json
│  └─ requirements.json
├─ dist/            # generated bundle for replies
├─ package.json
├─ tsconfig.json
├─ .env.example
└─ README.md (this file)
```

---

## 3) package.json

```json
{
  "name": "cx-training-kit",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "sync:entities": "ts-node src/cx/syncEntities.ts",
    "sync:intents": "ts-node src/cx/syncIntents.ts",
    "build:replies": "ts-node src/buildReplies.ts"
  },
  "dependencies": {
    "@google-cloud/dialogflow-cx": "^5.6.0",
    "dotenv": "^16.4.5"
  },
  "devDependencies": {
    "ts-node": "^10.9.2",
    "typescript": "^5.4.0"
  }
}
```

---

## 4) tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "dist"
  },
  "include": ["src", "data"]
}
```

---

## 5) .env.example

```
PROJECT_ID=your-gcp-project
LOCATION=global   # or asia-southeast1 as applicable
AGENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
LANGUAGE_CODE=en
GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/key.json
```

---

## 6) src/cx/auth.ts

```ts
import 'dotenv/config';
import {IntentsClient, EntityTypesClient} from '@google-cloud/dialogflow-cx';

export function cxConfig() {
  const project = process.env.PROJECT_ID!;
  const location = process.env.LOCATION!;
  const agent = process.env.AGENT_ID!;
  const languageCode = process.env.LANGUAGE_CODE || 'en';
  const parent = `projects/${project}/locations/${location}/agents/${agent}`;
  return {project, location, agent, languageCode, parent};
}

export const clients = {
  intents: new IntentsClient(),
  entities: new EntityTypesClient()
};
```

````

---

## 7) src/utils.ts

```ts
export function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
````

````

---

## 8) src/cx/syncEntities.ts

```ts
import {clients, cxConfig} from './auth';
import bases from '../../data/entities/doc_bases.json' assert {type: 'json'};
import variantsByBase from '../../data/entities/doc_variants_by_base.json' assert {type: 'json'};

/** Creates or updates @doc_base and @doc_variant (KIND_MAP, fuzzy). */
async function upsertEntityType(displayName: string, entities: {value: string, synonyms: string[]}[]) {
  const {parent} = cxConfig();
  const [list] = await clients.entities.listEntityTypes({parent});
  let et = list.find(e => e.displayName === displayName);
  const payload = {
    displayName,
    kind: 'KIND_MAP' as const,
    enableFuzzyExtraction: true,
    entities: entities.map(e => ({value: e.value, synonyms: e.synonyms}))
  };
  if (!et) {
    const [resp] = await clients.entities.createEntityType({parent, entityType: payload});
    console.log(`Created entity: ${resp.displayName}`);
  } else {
    const name = et.name!;
    const [resp] = await clients.entities.updateEntityType({entityType: {name, ...payload}, updateMask: {paths: ['entities', 'enable_fuzzy_extraction', 'kind']}});
    console.log(`Updated entity: ${resp.displayName}`);
  }
}

function flattenDocBase() {
  return bases.map((b: any) => ({
    value: b.base,
    synonyms: Array.from(new Set([b.base, ...b.synonyms.en, ...b.synonyms.fil]))
  }));
}

function flattenVariants() {
  const out: {value: string, synonyms: string[]}[] = [];
  for (const b of variantsByBase) {
    for (const v of b.variants) {
      out.push({
        value: v.name,
        synonyms: Array.from(new Set([v.name, ...v.synonyms.en, ...v.synonyms.fil]))
      });
    }
  }
  return out;
}

(async () => {
  await upsertEntityType('doc_base', flattenDocBase());
  await upsertEntityType('doc_variant', flattenVariants());
})();
````

````

---

## 9) src/cx/syncIntents.ts (minimal core intents)

```ts
import {clients, cxConfig} from './auth';

const CORE_INTENTS = [
  {
    displayName: 'REQUEST_SERVICE',
    trainingPhrases: [
      'Where can I request @doc_base:doc_base?',
      'How to apply for @doc_base:doc_base',
      'Need @doc_base:doc_base',
      'Kailangan ko ng @doc_base:doc_base',
      'Get @doc_base:doc_base online'
    ],
    parameters: [
      {displayName: 'doc_base', entityType: 'projects/-/locations/-/agents/-/entityTypes/doc_base', isList: false},
      {displayName: 'doc_variant', entityType: 'projects/-/locations/-/agents/-/entityTypes/doc_variant', isList: false, redact: false}
    ]
  },
  {
    displayName: 'REQUIREMENTS_QUERY',
    trainingPhrases: [
      'What are the requirements for @doc_base:doc_base @doc_variant:doc_variant',
      'Requirements for @doc_base:doc_base',
      'Ano ang requirements ng @doc_base:doc_base',
      'Kailangan para sa @doc_variant:doc_variant',
      'List the requirements for @doc_variant:doc_variant'
    ],
    parameters: [
      {displayName: 'doc_base', entityType: 'projects/-/locations/-/agents/-/entityTypes/doc_base'},
      {displayName: 'doc_variant', entityType: 'projects/-/locations/-/agents/-/entityTypes/doc_variant'}
    ]
  },
  {
    displayName: 'INCIDENT_HOW_TO_FILE',
    trainingPhrases: [
      'How can I file an incident', 'Paano mag-file ng reklamo', 'Where do I start my report'
    ]
  },
  { displayName: 'INCIDENT_DEPARTMENT_INFO', trainingPhrases: ['Difference between Lupon VAWC BCPC GAD', 'Saan ako mag-file Lupon o VAWC', 'BCPC vs GAD'] },
  { displayName: 'INCIDENT_STATUS_MEANING', trainingPhrases: ['Status codes meaning', 'Ano ibig sabihin ng archived', 'Why is my case pending'] },
  { displayName: 'INFO_OFFICE_HOURS', trainingPhrases: ['Office hours', 'Anong oras bukas barangay'] },
  { displayName: 'INFO_HOTLINES', trainingPhrases: ['Hotline number', 'Contact number ng barangay'] },
  { displayName: 'INFO_LOCATION', trainingPhrases: ['Where is the barangay hall', 'Saan ang barangay hall'] },
  { displayName: 'INFO_ANNOUNCEMENTS', trainingPhrases: ['Any announcements', 'Anong bago'] },
  { displayName: 'INFO_OFFICIALS', trainingPhrases: ['Who are the barangay officials', 'Sino ang mga opisyal'] }
];

async function upsertIntent(def: any) {
  const {parent} = cxConfig();
  const [list] = await clients.intents.listIntents({parent});
  let intent = list.find(i => i.displayName === def.displayName);
  const trainingPhrases = def.trainingPhrases.map((p: string) => ({parts: [{text: p}]}));
  const payload: any = {displayName: def.displayName, trainingPhrases};
  if (def.parameters) payload.parameters = def.parameters;
  if (!intent) {
    const [resp] = await clients.intents.createIntent({parent, intent: payload});
    console.log(`Created intent: ${resp.displayName}`);
  } else {
    const name = intent.name!;
    const [resp] = await clients.intents.updateIntent({intent: {name, ...payload}, updateMask: {paths: ['training_phrases', 'parameters']}});
    console.log(`Updated intent: ${resp.displayName}`);
  }
}

(async () => {
  for (const def of CORE_INTENTS) await upsertIntent(def);
})();
````

````

> Note: These create **NLU-only** intents. Connect them to your flow/pages and webhook in the CX console (or extend the script to add routes). Your webhook/frontend can look at the matched intent + parameters and respond using the bundled replies.

---

## 10) src/buildReplies.ts (bundles replies for your webhook/frontend)

```ts
import fs from 'fs';
import services from '../data/replies/services.json' assert {type: 'json'};
import nav from '../data/replies/navigation.json' assert {type: 'json'};
import reqs from '../data/requirements.json' assert {type: 'json'};

const out = {services, navigation: nav, requirements: reqs};
fs.mkdirSync('dist', {recursive: true});
fs.writeFileSync('dist/replies.compiled.json', JSON.stringify(out, null, 2));
console.log('Built dist/replies.compiled.json');
````

````

---

## 11) data/entities/doc_bases.json (from Part 1/6)

```json
[
  {"base":"Barangay Certificate","synonyms":{"en":["barangay certificate","brgy certificate","brgy cert","barangay cert","certificate","certification","barangay certification"],"fil":["sertipiko ng barangay","sertipikong barangay","sertipiko","sertipikasyon"]}},
  {"base":"Barangay Indigency","synonyms":{"en":["indigency","indigent certificate","certificate of indigency","indigent cert"],"fil":["sertipiko ng indigency","sertipiko ng pagiging maralita","sertipiko ng indigent","patunay ng indigency"]}},
  {"base":"Barangay Clearance","synonyms":{"en":["barangay clearance","brgy clearance","clearance","community clearance"],"fil":["clearance ng barangay","malinaw/clearance","katibayan mula sa barangay"]}},
  {"base":"Business Permit","synonyms":{"en":["barangay business permit","business permit","business clearance","business license (barangay)","brgy business permit"],"fil":["permit sa negosyo","barangay business clearance","lisensya sa negosyo (barangay)","pahintulot sa negosyo"]}},
  {"base":"Temporary Business Permit","synonyms":{"en":["temporary business permit","temp permit","special permit","short-term permit","pop-up/bazaar/tiangge permit","peddler permit"],"fil":["pansamantalang permit","panandaliang permit","special permit","permit sa tiangge"]}},
  {"base":"Construction Permit","synonyms":{"en":["construction permit","building permit","construction clearance","renovation permit","repair permit","fencing permit"],"fil":["permit sa konstruksyon","building permit","pahintulot sa pagtatayo","permit sa renobasyon/ayos","permit sa bakod"]}},
  {"base":"Other Documents","synonyms":{"en":["other documents","others","miscellaneous","misc","additional docs","jobseeker","first-time jobseeker","barangay ID","brgy id","ID"],"fil":["iba pang dokumento","iba pa","miscelaneous/misc","karagdagang dokumento","jobseeker","unang beses na jobseeker","ID ng barangay","ID"]}}
]
````

````

---

## 12) data/entities/doc_variants_by_base.json (from Part 2/6; normalized)

```json
[
  {"base":"Barangay Certificate","variants":[
    {"name":"Residency","synonyms":{"en":["certificate of residency","proof of residency","residency cert","resident certificate","proof of address","barangay residency"],"fil":["sertipiko ng paninirahan","patunay ng paninirahan","katibayan ng tirahan","sertipiko ng residente","paninirahan"]}},
    {"name":"Occupancy","synonyms":{"en":["certificate of occupancy","occupancy cert","proof of occupancy","dwelling occupancy","house occupancy","occupant certification"],"fil":["sertipiko ng tinitirhan","patunay ng tinitirhan","kasalukuyang tinitirhan","katunayan ng tirahang tinitirhan","tinitirhan"]}},
    {"name":"Estate Tax","synonyms":{"en":["estate tax requirement","estate settlement certificate","extrajudicial settlement requirement","inheritance/estate cert","BIR estate tax","transfer of title requirement"],"fil":["buwis sa ari-arian","requirement sa estate tax","sertipiko para sa pamana","extrajudicial settlement","paglilipat ng titulo"]}},
    {"name":"Death Residency","synonyms":{"en":["residency of the deceased","certificate of last residence","last known address cert","death claim residency","residency for death benefits"],"fil":["paninirahan ng yumao","sertipiko ng paninirahan ng namatay","huling tirahan","patunay ng huling tirahan"]}},
    {"name":"No Income","synonyms":{"en":["certificate of no income","no income cert","indigency (no income)","unemployed certificate","zero income declaration"],"fil":["walang kita","sertipiko ng walang kita","hindi kumikita","patunay na walang kita","walang trabaho (sertipiko)"]}},
    {"name":"Cohabitation","synonyms":{"en":["certificate of cohabitation","live-in certificate","common-law partner cert","living together certificate","cohabiting partners"],"fil":["magka-live in","sertipiko ng pagsasama","kinakasama","pagsasamang walang kasal","patunay na magkasama"]}},
    {"name":"Guardianship","synonyms":{"en":["guardianship certificate","certificate of legal guardian","barangay guardianship","guardian authorization","affidavit of guardianship"],"fil":["sertipiko ng tagapag-alaga","ligal na tagapag-alaga","patunay ng guardianship","pahintulot ng tagapag-alaga"]}},
    {"name":"Good Moral and Probation","synonyms":{"en":["certificate of good moral character","good moral certificate","moral character cert","probation requirement","barangay clearance for probation","behavior certificate"],"fil":["sertipiko ng mabuting asal","mabuting pag-uugali","requirement sa probation","katibayan ng mabuting asal"]}},
    {"name":"Garage/PUV","synonyms":{"en":["PUV garage certificate","LTFRB garage cert","garage proof for franchise","parking/garage availability","PUV franchise requirement"],"fil":["sertipiko ng garahe (PUV)","patunay ng garahe","requirement ng LTFRB","prangkisa (PUV) requirement","garahe para sa pampublikong sasakyan"]}},
    {"name":"Garage/TRU","synonyms":{"en":["tricycle garage certificate","TRU garage cert","tricycle franchise garage requirement","garage for tricycle unit","TODA requirement"],"fil":["sertipiko ng garahe (traysikel)","TRU requirement","prangkisa ng traysikel requirement","garahe para sa traysikel","requirement ng TODA"]}}
  ]},

  {"base":"Barangay Indigency","variants":[
    {"name":"No Income","synonyms":{"en":["no income certificate","certificate of no income","income-less","unemployed certificate","zero income","indigency (no income)","COI no income"],"fil":["walang kita","sertipiko ng walang kita","walang trabaho","hindi kumikita","patunay na walang kita"]}},
    {"name":"Public Attorney’s Office","synonyms":{"en":["PAO certificate","indigency for PAO","Public Attorney’s Office requirement","legal aid certificate","PAO endorsement"],"fil":["PAO","sertipiko para sa PAO","tulong legal","Abogado ng Bayan","requirement sa PAO"]}},
    {"name":"Financial Subsidy of Solo Parent","synonyms":{"en":["solo parent subsidy","solo parent cash aid","solo parent assistance","indigency for solo parent","SP assistance"],"fil":["tulong pinansyal sa solong magulang","ayuda solo parent","benepisyo ng solong magulang","sertipiko para sa solong magulang"]}},
    {"name":"Fire Victims","synonyms":{"en":["fire victim assistance","fire incident certificate (indigency)","nasunugan certificate","calamity (fire) indigency"],"fil":["biktima ng sunog","nasunugan","tulong sa nasunugan","sertipiko para sa nasunugan"]}},
    {"name":"Flood Victims","synonyms":{"en":["flood victim assistance","flooded household certificate (indigency)","calamity (flood) indigency"],"fil":["biktima ng baha","binaha","tulong sa binaha","sertipiko para sa biktima ng baha"]}},
    {"name":"PhilHealth Sponsor","synonyms":{"en":["PhilHealth sponsored member","PhilHealth indigent","sponsorship for PhilHealth","LGU-sponsored PhilHealth","Philhealth"],"fil":["PhilHealth libreng miyembro","iskolar/sponsored sa PhilHealth","indigent PhilHealth","sagot ng barangay sa PhilHealth"]}},
    {"name":"Medical Assistance","synonyms":{"en":["medical aid certificate","hospital bill assistance","medicine assistance","medical indigency","health assistance"],"fil":["tulong medikal","tulong sa ospital","gamot assistance","sertipiko para sa tulong medikal"]}}
  ]},

  {"base":"Barangay Clearance","variants":[
    {"name":"Loan","synonyms":{"en":["loan requirement","loan application clearance","salary loan","bank loan clearance","lending clearance"],"fil":["utang requirement","clearance para sa utang","pang-loan clearance","pahiram/loan clearance"]}},
    {"name":"Bank Transaction","synonyms":{"en":["bank requirement","open bank account","bank KYC","bank clearance","remittance requirement"],"fil":["requirement sa bangko","pagbubukas ng account","transaksyon sa bangko","clearance para sa bangko"]}},
    {"name":"Residency","synonyms":{"en":["certificate of residency (clearance)","residency clearance","proof of address","resident clearance"],"fil":["patunay ng paninirahan","sertipiko ng paninirahan","clearance ng residente","katibayan ng tirahan"]}},
    {"name":"Local Employment","synonyms":{"en":["employment clearance","job requirement","HR clearance","work clearance","local job clearance"],"fil":["clearance sa trabaho","requirement sa trabaho","pang-apply sa trabaho","HR requirement"]}},
    {"name":"Maynilad","synonyms":{"en":["water service clearance","Maynilad requirement","water connection clearance","water reconnection","water transfer"],"fil":["clearance sa tubig","requirement ng Maynilad","koneksyon sa tubig","rekonek sa tubig","lipat-pangalan sa tubig"]}},
    {"name":"Meralco","synonyms":{"en":["electric service clearance","Meralco requirement","electricity connection clearance","reconnection","name transfer"],"fil":["clearance sa kuryente","requirement ng Meralco","koneksyon sa kuryente","rekonek sa kuryente","lipat-pangalan sa kuryente"]}},
    {"name":"Bail Bond","synonyms":{"en":["bail clearance","bail bond requirement","court bail clearance","surety bond clearance"],"fil":["piansa clearance","requirement sa piansa","bond para sa piansa","clearance sa korte (piansa)"]}}
  ]},

  {"base":"Business Permit","variants":[
    {"name":"New","synonyms":{"en":["new application","first-time","initial filing","start a business permit","apply new"],"fil":["bago","unang apply","panimulang aplikasyon","mag-apply ng bago"]}},
    {"name":"Renewal","synonyms":{"en":["renewal","renew permit","extension","revalidation","annual renewal"],"fil":["renewal","pag-renew","pagpapanibago","pagpapalawig","taonang renewal"]}}
  ]},

  {"base":"Temporary Business Permit","variants":[
    {"name":"New","synonyms":{"en":["new temporary permit","first-time temporary","initial temporary application"],"fil":["bagong pansamantalang permit","unang apply (temporary)","panimulang temporary"]}},
    {"name":"Renewal","synonyms":{"en":["temporary permit renewal","renew temporary","reissue temporary"],"fil":["renewal ng temporary","pag-renew ng pansamantala","muling pag-isyu (temporary)"]}}
  ]},

  {"base":"Construction Permit","variants":[{"name":"Standard","synonyms":{"en":["construction","building","renovation","repair","fencing"],"fil":["konstruksyon","pagtatayo","renovation","pag-ayos","bakod"]}}]},

  {"base":"Other Documents","variants":[
    {"name":"Barangay ID","synonyms":{"en":["barangay id","resident id","community id","brgy id","identification card","barangay identification"],"fil":["id ng barangay","id ng residente","id ng komunidad","kumuha ng id"]}},
    {"name":"First Time Jobseeker","synonyms":{"en":["first-time jobseeker certificate","jobseeker assistance","first job certificate","fresh grad requirement"],"fil":["sertipiko ng unang beses mag-apply","first time jobseeker","tulong sa bagong aplikante","unang trabaho requirement"]}}
  ]}
]
````

````

> Note: We normalized *Construction Permit* to a single variant (Standard). Adjust later if you split by sub-type.

---

## 13) data/requirements.json (from Part 3/6; normalized)

```json
[
  {"base":"Barangay Certificate","variant":"Residency","age":"18+","frequency":"No limit","validity":"1 year","documents":["Signature over printed name","One of: Valid ID with a Barangay Fairview address / Barangay ID / Endorsement Letter from Homeowner/Sitio President","Picture taking at the barangay"],"requestor":"Residents","link":"/services/action?docB=Barangay%20Certificate"},
  {"base":"Barangay Certificate","variant":"Occupancy / Moving Out","age":"18+","frequency":"No limit","validity":"1 year","documents":["Signature over printed name","One of: Valid ID with a Barangay Fairview address / Barangay ID / Endorsement Letter from Homeowner/Sitio President"],"requestor":"Residents","link":"/services/action?docB=Barangay%20Certificate"},
  {"base":"Barangay Certificate","variant":"Estate Tax","age":"18+","frequency":"No limit","validity":"1 year","documents":["Signature over printed name","One of: Valid ID with a Barangay Fairview address / Barangay ID / Endorsement Letter from Homeowner/Sitio President","Death Certificate"],"requestor":"Residents","link":"/services/action?docB=Barangay%20Certificate"},
  {"base":"Barangay Certificate","variant":"Death Residency","age":"18+","frequency":"No limit","validity":"1 year","documents":["Signature over printed name","One of: Valid ID with a Barangay Fairview address / Barangay ID / Endorsement Letter from Homeowner/Sitio President","Death Certificate"],"requestor":"Residents","link":"/services/action?docB=Barangay%20Certificate"},
  {"base":"Barangay Certificate","variant":"No Income","age":"18+","frequency":"No limit","validity":"1 year","documents":["Signature over printed name","One of: Valid ID with a Barangay Fairview address / Barangay ID / Endorsement Letter from Homeowner/Sitio President"],"requestor":"Residents","link":"/services/action?docB=Barangay%20Certificate"},
  {"base":"Barangay Certificate","variant":"Cohabitation","age":"18+","frequency":"No limit","validity":"1 year","documents":["Signature over printed name","One of: Valid ID with a Barangay Fairview address / Barangay ID / Endorsement Letter from Homeowner/Sitio President"],"requestor":"Residents","link":"/services/action?docB=Barangay%20Certificate"},
  {"base":"Barangay Certificate","variant":"Guardianship","age":"18+","frequency":"No limit","validity":"1 year","documents":["Signature over printed name","One of: Valid ID with a Barangay Fairview address / Barangay ID / Endorsement Letter from Homeowner/Sitio President"],"requestor":"Residents","link":"/services/action?docB=Barangay%20Certificate"},
  {"base":"Barangay Certificate","variant":"Good Moral and Probation","age":"18+","frequency":"No limit","validity":"1 year","documents":["Signature over printed name","One of: Valid ID with a Barangay Fairview address / Barangay ID / Endorsement Letter from Homeowner/Sitio President"],"requestor":"Residents","link":"/services/action?docB=Barangay%20Certificate"},
  {"base":"Barangay Certificate","variant":"Garage/PUV","age":"18+","frequency":"No limit","validity":"1 year","documents":["Signature over printed name","One of: Valid ID with a Barangay Fairview address / Barangay ID / Endorsement Letter from Homeowner/Sitio President"],"requestor":"Residents","link":"/services/action?docB=Barangay%20Certificate"},
  {"base":"Barangay Certificate","variant":"Garage/TRU","age":"18+","frequency":"No limit","validity":"1 year","documents":["Signature over printed name","One of: Valid ID with a Barangay Fairview address / Barangay ID / Endorsement Letter from Homeowner/Sitio President"],"requestor":"Residents","link":"/services/action?docB=Barangay%20Certificate"},

  {"base":"Barangay Indigency","variant":"No Income","age":"18+","frequency":"No limit","validity":"1 year","documents":["Signature over printed name","One of: Valid ID with a Barangay Fairview address / Barangay ID / Endorsement Letter from Homeowner/Sitio President","Interview at the barangay"],"requestor":"Residents","link":"/services/action?docB=Barangay%20Indigency"},
  {"base":"Barangay Indigency","variant":"Public Attorney’s Office","age":"18+","frequency":"No limit","validity":"1 year","documents":["Signature over printed name","One of: Valid ID with a Barangay Fairview address / Barangay ID / Endorsement Letter from Homeowner/Sitio President","Interview at the barangay"],"requestor":"Residents","link":"/services/action?docB=Barangay%20Indigency"},
  {"base":"Barangay Indigency","variant":"Financial Subsidy of Solo Parent","age":"18+","frequency":"No limit","validity":"1 year","documents":["Signature over printed name","One of: Valid ID with a Barangay Fairview address / Barangay ID / Endorsement Letter from Homeowner/Sitio President","Interview at the barangay"],"requestor":"Residents","link":"/services/action?docB=Barangay%20Indigency"},
  {"base":"Barangay Indigency","variant":"Fire Victims","age":"18+","frequency":"No limit","validity":"1 year","documents":["Signature over printed name","One of: Valid ID with a Barangay Fairview address / Barangay ID / Endorsement Letter from Homeowner/Sitio President","Interview at the barangay"],"requestor":"Residents","link":"/services/action?docB=Barangay%20Indigency"},
  {"base":"Barangay Indigency","variant":"Flood Victims","age":"18+","frequency":"No limit","validity":"1 year","documents":["Signature over printed name","One of: Valid ID with a Barangay Fairview address / Barangay ID / Endorsement Letter from Homeowner/Sitio President","Interview at the barangay"],"requestor":"Residents","link":"/services/action?docB=Barangay%20Indigency"},
  {"base":"Barangay Indigency","variant":"PhilHealth Sponsor","age":"18+","frequency":"No limit","validity":"1 year","documents":["Signature over printed name","One of: Valid ID with a Barangay Fairview address / Barangay ID / Endorsement Letter from Homeowner/Sitio President","Interview at the barangay"],"requestor":"Residents","link":"/services/action?docB=Barangay%20Indigency"},
  {"base":"Barangay Indigency","variant":"Medical Assistance","age":"18+","frequency":"No limit","validity":"1 year","documents":["Signature over printed name","One of: Valid ID with a Barangay Fairview address / Barangay ID / Endorsement Letter from Homeowner/Sitio President","Interview at the barangay"],"requestor":"Residents","link":"/services/action?docB=Barangay%20Indigency"},

  {"base":"Barangay Clearance","variant":"Loan","age":"18+","frequency":"No limit","validity":"1 year","documents":["Signature over printed name","One of: Valid ID with a Barangay Fairview address / Barangay ID / Endorsement Letter from Homeowner/Sitio President"],"requestor":"Residents","link":"/services/action?docB=Barangay%20Clearance"},
  {"base":"Barangay Clearance","variant":"Bank Transaction","age":"18+","frequency":"No limit","validity":"1 year","documents":["Signature over printed name","One of: Valid ID with a Barangay Fairview address / Barangay ID / Endorsement Letter from Homeowner/Sitio President"],"requestor":"Residents","link":"/services/action?docB=Barangay%20Clearance"},
  {"base":"Barangay Clearance","variant":"Residency","age":"18+","frequency":"No limit","validity":"1 year","documents":["Signature over printed name","One of: Valid ID with a Barangay Fairview address / Barangay ID / Endorsement Letter from Homeowner/Sitio President"],"requestor":"Residents","link":"/services/action?docB=Barangay%20Clearance"},
  {"base":"Barangay Clearance","variant":"Local Employment","age":"18+","frequency":"No limit","validity":"1 year","documents":["Signature over printed name","One of: Valid ID with a Barangay Fairview address / Barangay ID / Endorsement Letter from Homeowner/Sitio President"],"requestor":"Residents","link":"/services/action?docB=Barangay%20Clearance"},
  {"base":"Barangay Clearance","variant":"Maynilad","age":"18+","frequency":"No limit","validity":"1 year","documents":["Signature over printed name","One of: Valid ID with a Barangay Fairview address / Barangay ID / Endorsement Letter from Homeowner/Sitio President"],"requestor":"Residents","link":"/services/action?docB=Barangay%20Clearance"},
  {"base":"Barangay Clearance","variant":"Meralco","age":"18+","frequency":"No limit","validity":"1 year","documents":["Signature over printed name","One of: Valid ID with a Barangay Fairview address / Barangay ID / Endorsement Letter from Homeowner/Sitio President"],"requestor":"Residents","link":"/services/action?docB=Barangay%20Clearance"},
  {"base":"Barangay Clearance","variant":"Bail Bond","age":"18+","frequency":"No limit","validity":"1 year","documents":["Signature over printed name","One of: Valid ID with a Barangay Fairview address / Barangay ID / Endorsement Letter from Homeowner/Sitio President"],"requestor":"Residents","link":"/services/action?docB=Barangay%20Clearance"},

  {"base":"Business Permit","variant":"New","age":"18+","frequency":"No limit","validity":"1 year","documents":["Signature over printed name","Valid ID","Certified True Copy of Title of Property / Contract of Lease","Certified True Copy of DTI Registration","Picture of CCTV installed in the establishment"],"requestor":"Residents / Non Residents","link":"/services/action?docB=Business%20Permit"},
  {"base":"Business Permit","variant":"Renewal","age":"18+","frequency":"No limit","validity":"1 year","documents":["Signature over printed name","Valid ID","Certified True Copy of Title of Property / Contract of Lease","Certified True Copy of DTI Registration","Picture of CCTV installed in the establishment"],"requestor":"Residents / Non Residents","link":"/services/action?docB=Business%20Permit"},

  {"base":"Temporary Business Permit","variant":"New","age":"18+","frequency":"No limit","validity":"1 year","documents":["Signature over printed name","Valid ID","Certified True Copy of Title of Property / Contract of Lease","Certified True Copy of DTI Registration","Picture of CCTV installed in the establishment"],"requestor":"Residents / Non Residents","link":"/services/action?docB=Temporary%20Business%20Permit"},
  {"base":"Temporary Business Permit","variant":"Renewal","age":"18+","frequency":"No limit","validity":"1 year","documents":["Signature over printed name","Valid ID","Certified True Copy of Title of Property / Contract of Lease","Certified True Copy of DTI Registration","Picture of CCTV installed in the establishment"],"requestor":"Residents / Non Residents","link":"/services/action?docB=Temporary%20Business%20Permit"},

  {"base":"Construction Permit","variant":"Standard","age":"18+","frequency":"No limit","validity":"1 year","documents":["Signature over printed name","Valid ID","Certified True Copy of Title of Property / Contract of Lease","Certified True Copy of Tax Declaration","Approved Building / Construction Plan"],"requestor":"Residents / Non Residents","link":"/services/action?docB=Construction%20Permit"},

  {"base":"Other Documents","variant":"Barangay ID","age":"18+","frequency":"No limit","validity":"1 year","documents":["Signature over printed name","Valid ID with an address in Barangay Fairview","2x2 Picture (optional)"],"requestor":"Residents","link":"/services/action?docB=Other%20Documents"},
  {"base":"Other Documents","variant":"First Time Jobseeker","age":"18+","frequency":"First request (no payment); succeeding requests (with payment)","validity":"1 year","documents":["Signature over printed name","One of: Valid ID with a Barangay Fairview address / Barangay ID / Endorsement Letter from Homeowner/Sitio President"],"requestor":"Residents","link":"/services/action?docB=Other%20Documents"}
]
````

````

---

## 14) data/replies/services.json (bot reply templates)

```json
{
  "common": {
    "gating_login": "Online submission is available to verified residents (sign in to continue).",
    "question_requirements": "Would you like me to list the requirements?"
  },
  "links": {
    "Barangay Certificate": "/services/action?docB=Barangay%20Certificate",
    "Barangay Indigency": "/services/action?docB=Barangay%20Indigency",
    "Barangay Clearance": "/services/action?docB=Barangay%20Clearance",
    "Business Permit": "/services/action?docB=Business%20Permit",
    "Temporary Business Permit": "/services/action?docB=Temporary%20Business%20Permit",
    "Construction Permit": "/services/action?docB=Construction%20Permit",
    "Other Documents": "/services/action?docB=Other%20Documents"
  },
  "intents": {
    "REQUEST_SERVICE": "Here’s where to request **{doc_base}{variant_suffix}**: **{link}**. {gating}",
    "REQUIREMENTS_QUERY": "Requirements for **{doc_base}{variant_suffix}** (Age: {age}; Validity: {validity}; Frequency: {frequency}):\n{bullets}\nStart here: **{link}**"
  }
}
````

```

---

## 15) data/replies/incidents.md (from Part 4/6; placeholders)

```

{BARANGAY\_NAME} | {CONTACT\_PHONE} | {OFFICE\_HOURS} | {INCIDENT\_LINK} | {STATUS\_PORTAL\_LINK}

### incident\_department\_info

* Lupon (Lupon Tagapamayapa): Community mediation for minor disputes (neighbor conflicts, noise, boundary, small debts). Goal: conciliation.
* VAWC: Violence Against Women and Children—abuse, threats, harassment. (If there’s immediate danger, call 911.)
* BCPC: Child protection—welfare, neglect, bullying, safety concerns.
* GAD: Gender and Development—gender-related programs, discrimination, inclusion, referrals.
  Tip (Tagalog): Kung alitan/away kapitbahay → Lupon. Kung karahasan sa kababaihan/bata → VAWC. Kung child welfare → BCPC. Kung gender concerns → GAD.

### incident\_bjs\_process\_overview

1. Report/Intake (online minor or in-person). 2) Assessment & triage. 3) Schedule dialogue/mediation. 4) Mediation/conciliation. 5) Settlement/Referral. 6) Closure/Elevation. (Major/urgent → in-person; emergencies → 911.)

### incident\_status\_meaning

New/Received; Pending/Under Review; For Scheduling/Scheduled; Ongoing; For Resolution; Resolved/Settled; Archived; Dismissed/Withdrawn; Referred.

### incident\_first\_step\_dialogue

Unang hakbang ang dialogue/mediation meeting sa barangay. Ididirekta ka sa tamang departamento depende sa kaso (Lupon/VAWC/BCPC/GAD).

### incident\_how\_to\_file

* Minor incidents: file online → {INCIDENT\_LINK}
* Major/urgent: report in person at {BARANGAY\_NAME} during {OFFICE\_HOURS} or call {CONTACT\_PHONE}
* Emergency: 911

### incident\_online\_vs\_major

Online = minor issues only. Major incidents require in-person reporting at the barangay (and/or police). For immediate danger, call 911.

### incident\_pending\_too\_long

We can follow up and reschedule if needed. Check {STATUS\_PORTAL\_LINK}, call {CONTACT\_PHONE}, or visit during {OFFICE\_HOURS}. If urgent, inform us.

### incident\_why\_pending

Possible causes: triage, waiting for docs, scheduling conflicts, respondent not reached, backlog. Action: give incident number; call {CONTACT\_PHONE} or visit {BARANGAY\_NAME} during {OFFICE\_HOURS}.

### incident\_contact\_info

Reach {BARANGAY\_NAME} via {CONTACT\_PHONE} or visit during {OFFICE\_HOURS}. Emergency: 911.

### incident\_multiple\_incidents

Yes. Related cases may be consolidated; distinct ones keep separate numbers. Include dates and details.

### incident\_safety\_escalation

If you’re in immediate danger, call 911 or go to the nearest police station. You can report to {BARANGAY\_NAME} after you are safe.

````

---

## 16) data/replies/navigation.json (from Part 5/6)

```json
{
  "Home": "/",
  "About Us": "/aboutus",
  "Services": "/services",
  "Incident Reports": "/IncidentReport",
  "Programs": "/Programs",
  "News/Announcements": "/Announcements",
  "Officials": "/OfficialsPage",
  "HOA Officers": "/OfficialsPage/HOAOfficersPage",
  "Sitio Officers": "/OfficialsPage/SitioOfficersPage"
}
````

---

## 17) How to wire this with your current frontend

* You're already passing a **sessionId** to `/api/dialogflow`. Also pass `user.uid`, `user.isVerified`, and `user.residentId` in `sessionInfo.parameters` so the webhook can personalize answers.
* After `detectIntent`, you can **override the text** using `dist/replies.compiled.json` + captured params (e.g., doc\_base/doc\_variant) to render our reply templates and requirement bullets.
* Or, attach a CX webhook to routes that match these intents and have the webhook read the same files (mount the repo or copy the JSON bundle).

## 18) Next additions (optional)

* Extend `src/cx/syncIntents.ts` to create **routes** and attach a **webhook** per intent if you want it 100% automated.
* Add Filipino reply variants and toggle by `LANGUAGE_CODE` or a session param.
* Add `@official_role`, `@sitio_name`, `@hoa_name` entities and corresponding intents when your roster is ready.

---


