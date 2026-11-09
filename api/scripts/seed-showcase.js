import {readFile} from 'node:fs/promises';
import {createDatabaseClient} from '../src/db/client.js';
import {normalizeSearch} from '../src/lib/search.js';
const rows=JSON.parse(await readFile(new URL('../data/showcase-dishes.json',import.meta.url),'utf8'));
let db;
try {
  if(process.argv.includes('--dry-run')) {
    console.log(rows.map(row=>({importKey:`showcase:${row.key}`,name:row.name,source:row.url})));
  } else {
    db=createDatabaseClient();
    const saved=await db.$transaction(async tx=>{
      const result=[];
      for(const row of rows) result.push(await tx.dish.upsert({
        where:{importKey:`showcase:${row.key}`}, update:{},
        create:{importKey:`showcase:${row.key}`,name:row.name,description:row.description,category:row.category,
          imagePath:`/images/editorial-${row.photo}.jpg`,photoType:`Ảnh minh họa · ${row.author} / Unsplash`,
          price:null,available:true,searchText:normalizeSearch(`${row.name} ${row.description} ${row.category}`)},
        select:{id:true,name:true},
      }));
      return result;
    });
    console.log(JSON.stringify(saved,null,2));
  }
} catch(error) {
  console.error('Không thể thêm gợi ý thực đơn.',error.code||error.name);process.exitCode=1;
} finally {await db?.$disconnect();}
