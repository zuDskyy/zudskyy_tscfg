#!/usr/bin/env node
import inquirer from "inquirer";
import path from 'path';
import { writeFile, readdir, readFile } from "fs/promises";
import { fileURLToPath } from "url";

const configFiles = {};
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configFolderPath = path.resolve(__dirname, 'config');

const defaultTechnology = { "technology": "node(Default)" };

(async () => {

    const files = await readdir(configFolderPath).catch(console.log);
    const useDefault = process.argv[2] === "-y";

    for (let i of files) {
        const frameworkName = i.split('.')[1];
        configFiles[frameworkName] = path.join(configFolderPath, i);
    }

    const { technology } = useDefault ? defaultTechnology : await inquirer.prompt([
        {
            type: "list",
            message: "Pick the technology you're using:",
            name: "technology",
            choices: Object.keys(configFiles),
        }
    ])

    let config = await readFile(configFiles[technology]).catch(console.log);

    const tsconfig = path.join(process.cwd(), 'tsconfig.json');

    if (technology === "node") {
        const reg = new RegExp(/(?<=v)(\d+)/);
        const version = parseInt(reg.exec(process.version)[0]);

        if (version >= 14) {
            // Optimal config for Node v14.0.0 (full ES2020)
            const updateConfig = {
                allowSyntheticDefaultImports: true,
                lib: ["es2020"],
                module: "commonjs",
                moduleResolution: "node",
                target: "es2020",
            };

            const configObj = Object.keys(updateConfig).reduce((prev, curr) => {
                return {
                    ...prev,
                    compilerOptions: {
                        ...prev.compilerOptions,
                        [curr]: updateConfig[curr],
                    },
                };
            }, JSON.parse(config.toString()));

            config = JSON.stringify(configObj, null, 2);
        }
    }

    await writeFile(tsconfig, config.toString()).catch(err => {
        console.log(err);
        process.exit();
    });

    console.log("tsconfig.json successfully created");
})();