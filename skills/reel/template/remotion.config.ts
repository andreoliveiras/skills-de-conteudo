import { Config } from '@remotion/cli/config';

Config.setEntryPoint('./src/index.ts');
Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
// Reels: h264 com qualidade alta sem virar arquivo gigante.
Config.setCodec('h264');
Config.setCrf(18);
