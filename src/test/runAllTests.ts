import * as cp from 'child_process';
import * as path from 'path';
import {
    downloadAndUnzipVSCode,
    resolveCliPathFromVSCodeExecutablePath,
    runTests
} from '@vscode/test-electron';

async function main() {
    try {
        const extensionDevelopmentPath = path.resolve(__dirname, '../../');
        const cp = require('child_process');
        const { downloadAndUnzipVSCode, resolveCliArgsFromVSCodeExecutablePath } = require('@vscode/test-electron')
        const vscodeExecutablePath = await downloadAndUnzipVSCode('1.63.1');
        const [cli, ...args] = resolveCliArgsFromVSCodeExecutablePath(vscodeExecutablePath);
    
        cp.spawnSync(cli, [...args, '--install-extension', 'angular.ng-template'], {
          encoding: 'utf-8',
          stdio: 'inherit'
        });

        const paths: { testsPath: string, projectPath: string | null }[] = [
            {
                testsPath: path.resolve(__dirname, './commonTests/suite/index'),
                projectPath: null
            },
            {
                testsPath: path.resolve(__dirname, './scss/suite/index'),
                projectPath: path.resolve(__dirname, '../../src/test/scss/test-project')
            },
            {
                testsPath: path.resolve(__dirname, './sass/suite/index'),
                projectPath: path.resolve(__dirname, '../../src/test/sass/test-project')
            },
            {
                testsPath: path.resolve(__dirname, './less/suite/index'),
                projectPath: path.resolve(__dirname, '../../src/test/less/test-project')
            },
            {
                testsPath: path.resolve(__dirname, './css/suite/index'),
                projectPath: path.resolve(__dirname, '../../src/test/css/test-project')
            }
        ];

        for (const proj of paths) {

            const args = proj.projectPath != null ? [proj.projectPath] : [];
            await runTests({
                launchArgs: args,
                extensionDevelopmentPath,
                extensionTestsPath: proj.testsPath,
                vscodeExecutablePath,
            });
        }
    } catch (err) {
        console.error('Failed to run tests');
        process.exit(1);
    }
}

main();
