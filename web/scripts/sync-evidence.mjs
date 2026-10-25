import {readFile,mkdir,writeFile} from 'node:fs/promises';
const source=new URL('../../evidence/',import.meta.url);
const destination=new URL('../public/evidence/',import.meta.url);
const json=await readFile(new URL('benchmark.json',source),'utf8');
const report=JSON.parse(json);
if(report.schema_version!==1 || report.hardware_used!==false || !Array.isArray(report.results) || !report.results.length) {
 throw new Error('Recorded simulation evidence is missing or has an unsupported schema. Run the benchmark first.');
}
const svg=await readFile(new URL('benchmark.svg',source),'utf8');
await mkdir(destination,{recursive:true});
await Promise.all([writeFile(new URL('benchmark.json',destination),json),writeFile(new URL('benchmark.svg',destination),svg)]);
console.log('Published the recorded simulation JSON and SVG without changing their contents.');
