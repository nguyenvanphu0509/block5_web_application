import test from 'node:test';
import assert from 'node:assert/strict';
import {createFixture} from './fixtures.js';
import {homeData} from '../api/src/home.js';
import {listRecords,dishQueries,queryState} from '../api/src/catalog.js';

test('featured restaurants are ranked before pagination; searches keep every matching restaurant',async()=>{
  const {db,storage}=createFixture();
  const base=storage.restaurant[0];
  for(const [id,name] of [[100,'The Monkey Gallery Dining'],[101,'Miên Saigon'],[102,'Vietnam House'],[103,'Hoi An Sense'],[104,'Ănăn Saigon'],[105,'Little Bear'],[106,'Hoa Túc (Sài Gòn)']]) {
    storage.restaurant.push({...base,id,name,isDemo:false});
  }
  const first=await homeData(db,{}),second=await homeData(db,{destinationPage:'2'});
  assert.deepEqual(first.restaurants.map(row=>row.name),['The Monkey Gallery Dining','Miên Saigon','Vietnam House','Hoi An Sense','Ănăn Saigon','Little Bear']);
  assert.equal(second.restaurants[0].name,'Hoa Túc (Sài Gòn)');
  assert.equal(new Set([...first.restaurants,...second.restaurants].map(row=>row.id)).size,storage.restaurant.length);
  const search=await homeData(db,{destinationQ:'Xôi Gà Number One'});
  assert.equal(search.restaurants[0].name,'Xôi Gà Number One');
});

test('menu prioritizes curated seafood without overriding price sorts or search relevance',async()=>{
  const {db,storage}=createFixture();
  const base=storage.dish[0];
  storage.dish.push({...base,id:900,name:'Hàu trên đá',category:'Hải sản',importKey:'showcase:oysters-lemon',available:true,price:900000});
  storage.dish.push({...base,id:901,name:'Đĩa tôm hùm',category:'Hải sản',importKey:'showcase:lobster-platter',available:true,price:600000});
  const menu=await listRecords(db,'dishes',db.dish,{});
  assert.deepEqual(menu.data.items.slice(0,2).map(row=>row.id),[900,901]);
  const priced=await listRecords(db,'dishes',db.dish,{sort:'price-asc'});
  assert.notEqual(priced.data.items[0].id,900);
  const featured=await homeData(db,{});
  assert.deepEqual(featured.featured.slice(0,2).map(row=>row.id),[900,901]);
  assert.match(dishQueries(queryState({q:'hàu',mode:'fulltext'})).items.text,/ORDER BY ts_rank/);
  assert.doesNotMatch(dishQueries(queryState({sort:'price-desc'})).items.text,/showcase:/);
});
