'use strict';
const catalog=window.BLOOM_PRODUCTS;
const $=id=>document.getElementById(id);
const money=c=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(c/100);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const colorMap={'Amarelo':'#e9bd37','Marrom':'#825231','Preto':'#252526','Rosa intenso':'#d82b62','Rosa':'#e4aac4','Verde':'#00805c','Verde-claro':'#81bd96','Verde-escuro':'#075d44','Azul':'#2587bd','Azul-claro':'#9dd7e2','Incolor':'linear-gradient(135deg,#fff,#bbc8d6,#fff)','Dourado':'#c8a34e','Vermelho':'#b21743','Lilás':'#b395cf'};
let category='Todos',active=null,variant=0,detailQty=1,lastFocus=null,toastTimer;
const selected=new Map();
let cart=[];
try{const saved=JSON.parse(localStorage.getItem('bloom-cart-v1')||'[]');if(Array.isArray(saved))cart=saved.filter(x=>catalog.some(p=>p.id===x.id&&p.variants[x.variant])&&Number.isInteger(x.qty)&&x.qty>0&&x.qty<=99).map(x=>({...x,note:String(x.note||'').slice(0,250)}));}catch{}
function save(){try{localStorage.setItem('bloom-cart-v1',JSON.stringify(cart));}catch{}updateBag();}
function openDialog(id){lastFocus=document.activeElement;$(id).showModal();document.body.classList.add('lock-scroll');}
function closeDialog(id){$(id).close();}
document.querySelectorAll('dialog').forEach(d=>{d.addEventListener('close',()=>{if(!document.querySelector('dialog[open]'))document.body.classList.remove('lock-scroll');});d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}});});
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>closeDialog(b.dataset.close));
function toast(text){$('toast').textContent=text;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),2300);}
function priceLabel(v){return v.price===null?'Preço sob consulta':money(v.price);}
function render(){
 const query=normalize($('search').value.trim());
 let list=catalog.filter(p=>(category==='Todos'||p.category===category)&&normalize(p.name+' '+p.category+' '+p.variants.map(v=>v.label).join(' ')).includes(query));
 const sort=$('sort').value;
 const minPrice=p=>Math.min(...p.variants.map(v=>v.price??Infinity));
 if(sort==='low')list.sort((a,b)=>minPrice(a)-minPrice(b));
 if(sort==='high')list.sort((a,b)=>(minPrice(a)===Infinity?1: minPrice(b)===Infinity?-1:minPrice(b)-minPrice(a)));
 if(sort==='name')list.sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
 $('results').textContent=`${list.length} ${list.length===1?'modelo':'modelos'} · uma seleção para florescer`;
 $('empty').hidden=!!list.length;
 $('products').innerHTML=list.map(p=>{const vi=selected.get(p.id)||0,v=p.variants[vi];return `<article class="product-card"><button class="card-photo" data-open="${p.id}" aria-label="Ver ${esc(p.name)}"><img src="${esc(v.images[0])}" loading="lazy" decoding="async" alt="${esc(p.name+' — '+v.label)}">${p.variants.length>1?`<span class="photo-tag">${p.variants.length} opções de cor</span>`:''}</button><div class="card-meta"><div><h3>${esc(p.name)}</h3><p>${priceLabel(v)}</p></div><button class="card-plus" data-add="${p.id}" aria-label="Escolher ${esc(p.name)}">+</button></div>${p.variants.length>1?`<div class="card-colors">${p.variants.map((v,i)=>`<button class="swatch ${vi===i?'selected':''}" style="background:${colorMap[v.label]||'#d7c7a8'}" data-color="${p.id}" data-variant="${i}" aria-label="${esc(v.label)}" aria-pressed="${vi===i}" title="${esc(v.label)}"></button>`).join('')}<span class="color-count">${esc(v.label)}</span></div>`:''}</article>`;}).join('');
 $('products').querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>showProduct(b.dataset.open));
 $('products').querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>showProduct(b.dataset.add));
 $('products').querySelectorAll('[data-color]').forEach(b=>b.onclick=()=>{selected.set(b.dataset.color,Number(b.dataset.variant));render();});
}
const cats=['Todos','Brincos','Colares','Conjuntos','Anéis','Pulseiras','Piercings'];
$('categories').innerHTML=cats.map(c=>`<button class="${c==='Todos'?'active':''}" aria-pressed="${c==='Todos'}">${c}</button>`).join('');
$('categories').querySelectorAll('button').forEach(b=>b.onclick=()=>{category=b.textContent;$('categories').querySelectorAll('button').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b));});render();});
$('search').oninput=render;$('sort').onchange=render;
function setImage(src){$('detail-image').src=src;$('detail-image').alt=active.name+' — '+active.variants[variant].label;}
function renderDetail(){const v=active.variants[variant];$('product-name').textContent=active.name;$('product-category').textContent=active.category;$('product-code').textContent='REF. '+active.id;$('product-price').textContent=priceLabel(v);$('product-note').textContent=active.note||'Escolha uma peça especial para acompanhar a sua história.';setImage(v.images[0]);$('thumbnails').innerHTML=v.images.length>1?v.images.map((src,i)=>`<button aria-label="Foto ${i+1}"><img src="${esc(src)}" alt="Foto ${i+1} de ${esc(active.name)}"></button>`).join(''):'';$('thumbnails').querySelectorAll('button').forEach((b,i)=>b.onclick=()=>setImage(v.images[i]));$('variants').hidden=active.variants.length===1;$('variant-buttons').innerHTML=active.variants.map((v,i)=>`<button class="${i===variant?'selected':''}" aria-pressed="${i===variant}">${esc(v.label)}</button>`).join('');$('variant-buttons').querySelectorAll('button').forEach((b,i)=>b.onclick=()=>{variant=i;selected.set(active.id,i);renderDetail();});$('detail-quantity').textContent=detailQty;$('detail-minus').disabled=detailQty<=1;$('detail-plus').disabled=detailQty>=99;}
function showProduct(id){active=catalog.find(p=>p.id===id);variant=selected.get(id)||0;detailQty=1;$('product-observation').value='';renderDetail();openDialog('product-dialog');}
$('detail-minus').onclick=()=>{detailQty=Math.max(1,detailQty-1);renderDetail();};$('detail-plus').onclick=()=>{detailQty=Math.min(99,detailQty+1);renderDetail();};
$('zoom').onclick=()=>{$('zoom-image').src=$('detail-image').src;$('zoom-image').alt=$('detail-image').alt;openDialog('zoom-dialog');};
$('add-detail').onclick=()=>{const note=$('product-observation').value.trim(),found=cart.find(x=>x.id===active.id&&x.variant===variant&&x.note===note);if(found)found.qty=Math.min(99,found.qty+detailQty);else cart.push({id:active.id,variant,qty:detailQty,note});save();closeDialog('product-dialog');render();toast('Peça adicionada ao seu carrinho');};
function totals(){let subtotal=0,pending=0,count=0;cart.forEach(x=>{const v=catalog.find(p=>p.id===x.id).variants[x.variant];count+=x.qty;if(v.price===null)pending+=x.qty;else subtotal+=v.price*x.qty;});return{subtotal,pending,count};}
function updateBag(){const t=totals();$('bag-count').textContent=t.count;$('floating-cart').hidden=!t.count;$('floating-label').textContent=`${t.count} ${t.count===1?'item':'itens'}${t.pending?'': ' · '+money(t.subtotal)}`;}
function showCart(){renderCart();openDialog('cart-dialog');}
$('open-cart').onclick=showCart;$('floating-cart').onclick=showCart;
function renderCart(){const t=totals();$('cart-bottom').hidden=!cart.length;if(!cart.length){$('cart-items').innerHTML='<p class="empty-cart">Seu próximo encanto espera por você.</p><p>Explore a coleção e adicione suas peças favoritas.</p>';return;}
 $('cart-items').innerHTML=cart.map((x,i)=>{const p=catalog.find(p=>p.id===x.id),v=p.variants[x.variant];return `<article class="cart-item"><img src="${esc(v.images[0])}" alt="${esc(p.name)}"><div><h3>${esc(p.name)}</h3><p>${p.id}${v.label==='Modelo da foto'?'':' · '+esc(v.label)}</p>${x.note?`<p>${esc(x.note)}</p>`:''}<p>${v.price===null?'Preço sob consulta':money(v.price)+' / item'}</p><div class="quantity"><button data-change="${i}" data-delta="-1" aria-label="Diminuir ${esc(p.name)}" ${x.qty<=1?'disabled':''}>−</button><output>${x.qty}</output><button data-change="${i}" data-delta="1" aria-label="Aumentar ${esc(p.name)}" ${x.qty>=99?'disabled':''}>+</button></div><button class="remove" data-remove="${i}" aria-label="Retirar ${esc(p.name)}">Retirar</button><strong class="item-price">${v.price===null?'A confirmar':money(v.price*x.qty)}</strong></div></article>`;}).join('');
 $('cart-items').querySelectorAll('[data-change]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.change);cart[i].qty=Math.min(99,Math.max(1,cart[i].qty+Number(b.dataset.delta)));save();renderCart();});
 $('cart-items').querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{cart.splice(Number(b.dataset.remove),1);save();renderCart();});
 $('cart-total').textContent=t.pending&&t.subtotal===0?'A confirmar':money(t.subtotal);$('total-label').textContent=t.pending?'Subtotal com preço confirmado':'Total das peças';$('pending-note').hidden=!t.pending;$('pending-note').textContent=`${t.pending} ${t.pending===1?'item está com preço':'itens estão com preços'} sob consulta e não ${t.pending===1?'está incluído':'estão incluídos'} no subtotal. A Bloom confirmará o valor completo no atendimento.`;
}
function orderText(){const t=totals(),name=$('customer-name').value.trim();const lines=['Olá, Bloom! '+(name?'Meu nome é '+name+'. ':'')+'Gostaria de fazer este pedido:',''];cart.forEach(x=>{const p=catalog.find(p=>p.id===x.id),v=p.variants[x.variant];lines.push(`${x.qty} × ${p.name} (${p.id})`);if(v.label!=='Modelo da foto')lines.push('Cor/opção: '+v.label);lines.push(v.price===null?'Preço: sob consulta':`Unitário: ${money(v.price)} | Subtotal: ${money(v.price*x.qty)}`);if(x.note)lines.push('Detalhes: '+x.note);lines.push('');});lines.push(`${t.pending?'Subtotal dos itens com preço confirmado':'Total das peças'}: ${money(t.subtotal)}`);if(t.pending)lines.push(`${t.pending} item(ns) com preço sob consulta, não incluído(s) no subtotal.`);if($('cart-observation').value.trim())lines.push('Observações: '+$('cart-observation').value.trim());lines.push('','Pode confirmar a disponibilidade, '+(t.pending?'os preços pendentes, ':'')+'o frete e as formas de pagamento?');return lines.join('\n');}
$('checkout').onclick=()=>{if(!cart.length)return;const url='https://wa.me/5562982367414?text='+encodeURIComponent(orderText());window.open(url,'_blank','noopener,noreferrer');};
$('hero-image').src=catalog.find(p=>p.name==='Conjunto Flor de Água').variants[0].images[1];
render();updateBag();
