import 'dotenv/config';
import {IntentsClient, EntityTypesClient} from '@google-cloud/dialogflow-cx';
export function cxConfig() {
  const project = process.env.PROJECT_ID!;
  const location = process.env.LOCATION!;      // e.g. asia-southeast1 or us-central1 or global
  const agent = process.env.AGENT_ID!;
  const languageCode = process.env.LANGUAGE_CODE || 'en';
  const parent = `projects/${project}/locations/${location}/agents/${agent}`;
  return { project, location, agent, languageCode, parent };
}

const { location } = cxConfig();
const apiEndpoint =
  location && location !== 'global'
    ? `${location}-dialogflow.googleapis.com`
    : 'dialogflow.googleapis.com';

export const clients = {
  intents: new IntentsClient({ apiEndpoint }),
  entities: new EntityTypesClient({ apiEndpoint }),
};