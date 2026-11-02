(() => {
 function attach(root=document) {
  root.querySelectorAll('.image-fallback img').forEach(image=>{
   if(image.dataset.fallbackBound)return;
   image.dataset.fallbackBound='true';
   function fallback(){
    image.src=image.closest('.restaurant-card,.restaurant-space')?'/images/restaurant.svg':'/images/noodles.svg';
    image.alt=`Ảnh minh họa dự phòng: ${image.alt}`;
   }
   image.addEventListener('error',fallback,{once:true});
   if(image.complete&&image.naturalWidth===0&&image.getAttribute('src'))fallback();
  });
 }
 attach();
 document.addEventListener('home:updated',event=>attach(event.detail.section));
 document.addEventListener('catalog:updated',event=>attach(event.detail.section));
})();
