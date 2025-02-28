import { SinglePageApp } from '~components/layouts/app';
import { getRoutes } from '~pages/routes';

// routes of options page
const routes = getRoutes('options');

// The options page is meant to be a dedicated place for the extension's settings and configuration.
function IndexOptions() {
    return <SinglePageApp className="flex h-full w-full flex-col" routes={routes} />;
}

export default IndexOptions;
