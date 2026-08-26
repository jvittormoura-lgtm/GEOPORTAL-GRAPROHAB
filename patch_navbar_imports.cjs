const fs = require('fs');
let content = fs.readFileSync('src/components/Navbar.tsx', 'utf8');

content = content.replace("import { SAMPLE_DATASETS } from '../utils/sampleDatasets';", "");
content = content.replace("const [isSampleDropdownOpen, setIsSampleDropdownOpen] = useState(false);", "");
content = content.replace("onLoadSampleDataset,", "");
content = content.replace("onLoadSampleDataset: (id: string) => void;", "");

fs.writeFileSync('src/components/Navbar.tsx', content);
