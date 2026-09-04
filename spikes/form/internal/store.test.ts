import { describeStoreConformance } from '../shared/conformance';

import { createFormStore } from './store';

describeStoreConformance('internal store', createFormStore);
