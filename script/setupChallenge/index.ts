import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import inquirer from 'inquirer';
import createPupppet from "puppeteer"
import TurndownService from 'turndown';
import fs from 'fs';
import path from 'path';

const browse = await createPupppet.launch({
  executablePath: "/usr/bin/google-chrome",
  headless: false,
  defaultViewport: {
    width: 1920,
    height: 1080
  }
})

const page = await browse.newPage()
const validYears: number[] = [2023, 2024];
const validDays: number[] = Array.from({ length: 25 }, (_, i) => i + 1);

async function getYearAndDay(): Promise<{ year: number; day: number }> {
  const argv = await yargs(hideBin(process.argv))
    .option('year', {
      alias: 'y',
      type: 'number',
      description: 'Ano desejado',
      choices: validYears
    })
    .option('day', {
      alias: 'd',
      type: 'number',
      description: 'Dia desejado',
      choices: validDays
    })
    .option('today', {
      alias: 'n',
      type: 'boolean',
      "default": false,
      description: 'Usar o ano e o dia atuais'
    })
    .argv;
  
  let { year, day, now } = argv;

  const currentDate = new Date();
  if (now) {
    year = currentDate.getFullYear();
    day = currentDate.getDate();
  } 
    if (!year || !validYears.includes(year)) {
      const yearAnswer = await inquirer.prompt<{ year: number }>({
        type: 'list',
        name: 'year',
        default:  currentDate.getFullYear() > 2024 ? "2024" : String(currentDate.getFullYear()),
        message: `Qual ano você deseja (opções: ${validYears.join(', ')}):`,
        choices: validYears.map(String)
      });
      year = yearAnswer.year;
    }

    if (!day || !validDays.includes(day)) {
      const dayAnswer = await inquirer.prompt<{ day: number }>({
        type: 'list',
        default: currentDate.getDate() > 25 ? "25" : String(currentDate.getDate()),
        name: 'day',
        message: 'Qual dia você deseja (1-25):',
        choices: validDays.map(String)
      });
      day = dayAnswer.day;
    }

  return { year, day };
}

const { year, day } = await getYearAndDay();
console.log(`Ano selecionado: ${year}, Dia selecionado: ${day}`);

const url = `https://www.adventofts.com/events/${year}/${day}`;
console.log(`Acessando URL: ${url}`);

await page.goto(url)

// pega o conteudo de .prose-invert

const content = await page.$eval(".prose-invert", el => el.innerHTML)

await page.waitForSelector("[role=\"presentation\"].editor-scrollable")

const turndownService = new TurndownService();
const challengDescription = turndownService.turndown(content);

const [initialCode,testCases] = await page.$$eval("[role=\"presentation\"].view-lines", els => els.map(el => el.innerText))

console.log({
  challengDescription,
  initialCode,
  testCases
})

await browse.close()

// Verifica e cria as pastas do ano e do dia
const yearPath = path.join(process.cwd(), String(year));
const dayPath = path.join(yearPath, String(day));

if (!fs.existsSync(yearPath)) {
  fs.mkdirSync(yearPath);
}

if (!fs.existsSync(dayPath)) {
  fs.mkdirSync(dayPath);
}

// Cria o arquivo README.md
fs.writeFileSync(path.join(dayPath, 'README.md'), challengDescription.replaceAll(" ", " "));

// Cria o arquivo challenge.ts
fs.writeFileSync(path.join(dayPath, 'challenge.ts'), initialCode.replaceAll(" ", " "));

// Cria o arquivo test.ts
fs.writeFileSync(path.join(dayPath, 'test.ts'), testCases.replaceAll(" ", " "));