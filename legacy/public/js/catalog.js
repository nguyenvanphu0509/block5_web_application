const section=document.querySelector('[data-catalog-view]');
if(section && section.dataset.catalogView!=='pages'){
 let next=section.querySelector('[data-next-page]')?.href,busy=false;
 const button=document.createElement('button');button.className='button';button.textContent='Tải thêm';
 const pagination=section.querySelector('.pagination');if(pagination&&next){pagination.hidden=true;section.append(button);}
 async function load(){if(!next||busy)return;busy=true;button.disabled=true;try{const response=await fetch(next);if(!response.ok||new URL(response.url).pathname==='/login'){location.href=response.url;return;}const doc=new DOMParser().parseFromString(await response.text(),'text/html');const grid=doc.querySelector('.dish-grid');if(!grid)throw new Error();section.querySelector('.dish-grid').append(...grid.children);document.dispatchEvent(new CustomEvent('catalog:updated',{detail:{section}}));next=doc.querySelector('[data-next-page]')?.href;button.hidden=!next;}catch{button.textContent='Thử tải lại';}finally{busy=false;button.disabled=false;}}
 button.addEventListener('click',load);if(section.dataset.catalogView==='infinite')new IntersectionObserver(entries=>{if(entries[0].isIntersecting)load();},{rootMargin:'200px'}).observe(button);
}

const searchForm = document.querySelector('#dish-search-form');
if (searchForm) {
 if (location.hash === '#search') searchForm.querySelector('#dish-search').focus();
 const descriptions = {
  basic: 'Tìm theo tên món. Thử “phở” để khám phá Phở bò, Phở gà.',
  advanced: 'Kết hợp tên món, loại món và khoảng giá bạn muốn.',
  fulltext: 'Tìm từ khóa trong cả tên và mô tả món ăn.',
  fuzzy: 'Gợi ý tên món gần đúng khi bạn gõ sai một vài ký tự.',
 };
 searchForm.elements.mode.addEventListener('change', event => {
  searchForm.querySelector('[data-search-help]').textContent = descriptions[event.target.value];
 });
 document.querySelectorAll('[data-catalog-display]').forEach(control => {
  control.addEventListener('change', () => searchForm.requestSubmit());
 });
}
