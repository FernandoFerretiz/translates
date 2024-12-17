const readline = require('readline');
const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const DeepL = require('deepl-node');
require('dotenv').config();

(() => {
  /**
   * DeepL API Key from environment variables.
   * @constant {string}
   */
  const DEEPL_API_KEY = process.env.DEEPL_API_KEY;

  /**
   * Markdown log for generated translations.
   * @type {string}
   */
  let logMarkdown = '# Traducciones Generadas\n\n';

  /**
   * DeepL Translator client.
   * @constant {Object}
   */
  const translator = new DeepL.Translator(DEEPL_API_KEY);

  /**
   * Recursively extracts all keys and values from a nested object as a flat object.
   * @param {Object} obj - The input object to extract keys from.
   * @param {string} parentKey - Parent key for recursion.
   * @returns {Object} - A flat object with keys and values.
   */
  function extractKeys(obj, parentKey = '') {
    let keyValuePairs = {};
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        const fullKey = parentKey ? `${parentKey}.${key}` : key;
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          Object.assign(keyValuePairs, extractKeys(obj[key], fullKey));
        } else {
          keyValuePairs[fullKey] = obj[key];
        }
      }
    }
    return keyValuePairs;
  }

  /**
   * Reads and parses a JSON file.
   * @param {string} filePath - Path to the JSON file.
   * @returns {Promise<Object>} - A promise that resolves with the parsed JSON object.
   */
  function readJsonFile(filePath) {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) return reject(`Error reading the file: ${err}`);
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (e) {
          reject(`Error parsing JSON: ${e}`);
        }
      });
    });
  }

  /**
   * Translates missing keys using the DeepL API.
   * @param {Object} missingKeysObject - Object with keys to be translated.
   * @param {string} targetLanguage - Target language code (e.g., 'es').
   * @returns {Promise<Object>} - A promise that resolves with the translated keys.
   */
  function translateMissingKeys(missingKeysObject, targetLanguage) {
    const textToTranslate = Object.values(missingKeysObject).join("\n");
    return translator
      .translateText(textToTranslate, null, targetLanguage)
      .then(result => {
        let translatedObject = {};
        const translations = result.text.split("\n");

        logMarkdown += `## Traducción para el idioma: \`${targetLanguage}\`\n\n`;
        logMarkdown += '| Key | Translation |\n|-------|------------|\n';

        let idx = 0;
        for (let key in missingKeysObject) {
          logMarkdown += `| ${key} | ${translations[idx]} |\n`;
          translatedObject[key] = translations[idx];
          idx++;
        }
        logMarkdown += `\n---\n`;
        return translatedObject;
      })
      .catch(error => {
        throw new Error(`Error in translation: ${error.message}`);
      });
  }

  /**
   * Compares keys between base JSON and target JSON files, translates missing keys, and updates files.
   * @param {Object} baseKeys - Base keys from the reference JSON file.
   * @param {string[]} selectedFiles - List of target JSON files to process.
   * @param {string} directoryPath - Directory containing the JSON files.
   * @param {boolean} replaceOriginal - Whether to replace the original files or create new ones.
   * @returns {Promise<void>}
   */
  function compareKeys(baseKeys, selectedFiles, directoryPath, replaceOriginal) {
    const promises = selectedFiles.map(file => {
      const filePath = path.join(directoryPath, file);
      const targetLanguage = path.basename(file, '.json');

      return readJsonFile(filePath).then(jsonData => {
        const fileKeys = extractKeys(jsonData);
        const missingKeys = Object.keys(baseKeys).filter(key => !(key in fileKeys));

        if (missingKeys.length > 0) {
          let missingKeysObject = {};
          missingKeys.forEach(key => {
            missingKeysObject[key] = baseKeys[key];
          });

          return translateMissingKeys(missingKeysObject, targetLanguage).then(translatedObject => {
            for (let key in translatedObject) {
              const keys = key.split('.');
              let currentObj = jsonData;

              for (let i = 0; i < keys.length - 1; i++) {
                if (!currentObj[keys[i]]) currentObj[keys[i]] = {};
                currentObj = currentObj[keys[i]];
              }
              currentObj[keys[keys.length - 1]] = translatedObject[key];
            }

            const outputFilePath = replaceOriginal
              ? filePath
              : path.join(directoryPath, 'translates', file);

            if (!replaceOriginal && !fs.existsSync(path.join(directoryPath, 'translates'))) {
              fs.mkdirSync(path.join(directoryPath, 'translates'));
            }

            fs.writeFileSync(outputFilePath, JSON.stringify(jsonData, null, 2), 'utf8');
            console.log(`File processed successfully: ${outputFilePath}`);
          });
        } else {
          console.log(`All keys are present in ${file}.`);
        }
      });
    });

    return Promise.all(promises);
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Please enter a path: ', (inputPath) => {
    const resolvedPath = path.resolve(inputPath.trim());

    if (!fs.existsSync(resolvedPath)) {
      console.error(`Error: The path ${resolvedPath} does not exist.`);
      rl.close();
      return;
    }

    fs.readdir(resolvedPath, (err, files) => {
      if (err) {
        console.error('Error reading the directory:', err);
        rl.close();
        return;
      }

      const jsonFiles = files.filter(file => file.endsWith('.json'));

      if (!jsonFiles.includes('en.json')) {
        console.error('Error: en.json not found in the specified path.');
        rl.close();
        return;
      }

      const enJsonPath = path.join(resolvedPath, 'en.json');
      readJsonFile(enJsonPath)
        .then(enJsonData => {
          const baseKeys = extractKeys(enJsonData);

          const otherJsonFiles = jsonFiles.filter(file => file !== 'en.json');
          const prompt = inquirer.createPromptModule();

          prompt([
            {
              type: 'checkbox',
              name: 'selectedFiles',
              message: 'Select files to process:',
              choices: otherJsonFiles,
              validate: (answer) => (answer.length < 1 ? 'You must select at least one file.' : true)
            },
            {
              type: 'list',
              name: 'replaceOriginal',
              message: 'Do you want to replace the original file or create a new folder with translated files?',
              choices: ['Replace original files', 'Create a new folder'],
            }
          ]).then(answers => {
            const selectedFiles = answers.selectedFiles;

            if (selectedFiles.length === 0) {
              console.log('No files selected for processing.');
              rl.close();
              return;
            }

            console.log('Processing selected files:', selectedFiles);
            compareKeys(baseKeys, selectedFiles, resolvedPath, answers.replaceOriginal === 'Replace original files')
              .then(() => {
                const logPath = path.join(resolvedPath, 'translation_log.md');
                fs.writeFileSync(logPath, logMarkdown, 'utf8');
                rl.close();
              });
          });
        })
        .catch(error => {
          console.error('Error reading en.json:', error.message);
          rl.close();
        });
    });
  });
})();
