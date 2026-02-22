import auth from './auth.json';
import blueprint from './blueprint.json';
import community from './community.json';
import editor from './editor.json';
import exportResource from './export.json';
import home from './home.json';
import profile from './profile.json';
import routes from './routes.json';

const resources = {
  routes,
  home,
  community,
  editor,
  export: exportResource,
  blueprint,
  auth,
  profile,
} as const;

export default resources;
