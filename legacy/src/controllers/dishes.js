import {listRecords,queryState,sorts as sortOptions} from '../../../api/src/catalog.js';
import { parseId, HttpError } from '../validators/index.js';
export function createDishController(db) {
  return {
    async index(req, res) {
      const {data,meta}=await listRecords(db,'dishes',db.dish,req.query);
      const state={...queryState(req.query),view:['more','infinite'].includes(req.query.view)?req.query.view:'pages'};
      const pages=Math.ceil(data.total/state.pageSize);
      const href=(changes={})=>`/dishes?${new URLSearchParams(Object.entries({...state,...changes}).filter(([,v])=>v!==null&&v!==''))}#menu-results`;
      const pageNumbers=[...new Set([1,pages,...Array.from({length:5},(_,i)=>state.page+i-2)])].filter(p=>p>0&&p<=pages).sort((a,b)=>a-b);
      res.render('dishes/index',{title:'Thực đơn',q:state.q,state,dishes:data.items,total:data.total,count:data.total,pages,pageNumbers,pageSize:state.pageSize,sortOptions,href,categories:meta.categories});
    },
    async show(req, res) {
      const dish = await db.dish.findUnique({ where: { id: parseId(req.params.id) }, include: { restaurant: true, chef: true, ingredients: { include: { ingredient: true } } } });
      if (!dish) throw new HttpError(404, 'Món ăn này không tồn tại.');
      res.render('dishes/show', { title: dish.name, dish });
    },
  };
}
