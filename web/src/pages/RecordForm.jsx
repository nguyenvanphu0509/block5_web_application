import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { resources, validateInput } from '../../../shared/resources.js';
import { api } from '../api.js';
import { useLoad } from '../hooks.js';
import { AdminNav, FieldError, Picture, StateView } from '../components.jsx';

export function RecordForm({ resource, editing = false }) {
  const { id } = useParams();
  const state = useLoad(`${resource}/${editing ? id : 'new'}`, async signal => {
    const [config, record, restaurants, chefs, ingredients] = await Promise.all([
      api('/config', { signal }), editing ? api(`/${resource}/${id}`, { signal }) : null,
      resource === 'dishes' ? api('/restaurants', { signal }) : null,
      resource === 'dishes' ? api('/chefs', { signal }) : null,
      resource === 'dishes' ? api('/ingredients', { signal }) : null,
    ]);
    return { config: config.data, record: record?.data, restaurants: restaurants?.data || [], chefs: chefs?.data || [], ingredients: ingredients?.data || [] };
  });
  return <main id="main" tabIndex="-1" className="shell page-main admin-main"><AdminNav/><StateView state={state}/>{state.result && <Editor key={`${resource}/${id || 'new'}`} resource={resource} editing={editing} {...state.result}/>}</main>;
}
function Editor({ resource, editing, record, config, restaurants, chefs, ingredients }) {
  const definition = resources[resource], navigate = useNavigate(), submitting = useRef(false), requestController = useRef(null), form = useRef(null);
  const [values, setValues] = useState(() => ({ available: true, priceIsDemo: true, recipeIsDemo: true, ...record, price: record?.price ?? '', priceUnknown: editing && record?.price == null, restaurantId: record?.restaurantId || '', chefId: record?.chefId || '', ingredientIds: record?.ingredients?.map(x => x.ingredientId) || [], notableDishes: record?.notableDishes?.join(', ') || '', imagePath: '' }));
  const [errors, setErrors] = useState({}), [failure, setFailure] = useState(null), [pending, setPending] = useState(false);
  const [newIngredients, setNewIngredients] = useState([{ name: '', unit: '' }]);
  const [imageMode, setImageMode] = useState('url'), [file, setFile] = useState(null), [fileUrl, setFileUrl] = useState(null);
  useEffect(() => () => requestController.current?.abort(), []);
  useEffect(() => { if (!file) { setFileUrl(null); return; } const url = URL.createObjectURL(file); setFileUrl(url); return () => URL.revokeObjectURL(url); }, [file]);
  function change(name, value) { setValues(old => ({ ...old, [name]: value })); setErrors(old => ({ ...old, [name]: undefined })); }
  const attrs = name => ({ id: name, name, 'aria-invalid': errors[name] ? true : undefined, 'aria-describedby': errors[name] ? `${name}-error` : undefined });
  function payload() {
    const result = {};
    for (const [field, , type] of definition.fields) {
      result[field] = type === 'checkbox' ? !!values[field] : type === 'price' ? values.priceUnknown ? null : values.price === '' ? undefined : Number(values.price) : type === 'list' ? String(values[field] || '').split(',').map(x => x.trim()).filter(Boolean) : values[field] ?? '';
    }
    for (const key of resource === 'dishes' ? ['priceIsDemo', 'recipeIsDemo'] : ['isDemo']) result[key] = !!values[key];
    if (resource === 'dishes') {
      for (const key of ['restaurantId', 'chefId']) result[key] = values[key] ? Number(values[key]) : null;
      result.ingredientIds = values.ingredientIds;
      result.newRestaurantName = values.newRestaurantName || ''; result.newChefName = values.newChefName || '';
      result.newIngredients = newIngredients.filter(x => x.name.trim() || x.unit.trim());
    }
    if (imageMode === 'url' && values.imagePath?.trim()) result.imagePath = values.imagePath.trim();
    return result;
  }
  async function submit(event) {
    event.preventDefault(); if (submitting.current || config.preview) return;
    const body = payload(), validation = validateInput(body, resource);
    const fields = { ...validation.errors };
    if (body.imagePath && !config.imageChoices.some(x => x.path === body.imagePath)) {
      try { const url = new URL(body.imagePath); if (url.protocol !== 'https:' || url.username || url.password || url.port || (!config.imageOrigins.includes(url.origin) && !/^[a-z0-9-]+\.supabase\.co$/.test(url.hostname))) throw new Error(); }
      catch { fields.imagePath = 'Chọn URL HTTPS từ nguồn ảnh được cho phép.'; }
    }
    if (imageMode === 'file' && file && (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024)) fields.imageFile = 'Chọn ảnh JPG, PNG hoặc WebP không quá 5 MB.';
    setErrors(fields); setFailure(null);
    if (Object.keys(fields).length) { setTimeout(() => form.current?.querySelector('[aria-invalid=true]')?.focus(), 0); return; }
    submitting.current = true; setPending(true);
    const controller = new AbortController(); requestController.current = controller;
    try {
      const result = await api(`/${resource}${editing ? `/${record.id}` : ''}`, { method: editing ? 'PATCH' : 'POST', data: body, file: imageMode === 'file' ? file : null, signal: controller.signal });
      if (!controller.signal.aborted) navigate(`/admin/${resource}/${result.data.id}`, { state: { notice: editing ? 'Đã lưu thay đổi.' : 'Đã thêm bản ghi.' } });
    } catch (error) {
      if (controller.signal.aborted) return;
      if (error.code === 'VALIDATION_FAILED' || error.code === 'ALREADY_EXISTS') { setErrors(error.fields || {}); setTimeout(() => form.current?.querySelector('[aria-invalid=true]')?.focus(), 0); }
      else setFailure(error);
    } finally { submitting.current = false; if (!controller.signal.aborted) setPending(false); }
  }
  return <section className="form-card"><Link className="back-link" to={`/admin/${resource}`}>← Về danh sách</Link><h1>{editing ? 'Sửa' : 'Thêm'} {definition.singular}</h1><p>Các trường có dấu * là bắt buộc.</p>{config.preview && <p className="preview-note" role="status">Chế độ chỉ đọc · không thể lưu.</p>}{failure && <div className="empty-state" role="alert"><h2>{failure.code === 'NOT_FOUND' ? 'Bản ghi không còn tồn tại' : 'Chưa thể lưu'}</h2><p>{failure.message}</p></div>}{Object.values(errors).some(Boolean) && <div className="error-summary" role="alert"><strong>Kiểm tra các trường sau:</strong><ul>{Object.entries(errors).filter(([, text]) => text).map(([field, text]) => <li key={field}><a href={`#${field}`}>{text}</a></li>)}</ul></div>}<form ref={form} onSubmit={submit} noValidate><fieldset disabled={pending || config.preview} className="editor-fields">
    {definition.fields.map(([name, label, type, max, required]) => <div className="field" key={name}>{type === 'checkbox' ? <label className="checkbox-label"><input {...attrs(name)} type="checkbox" checked={!!values[name]} onChange={e => change(name, e.target.checked)}/>{label}</label> : <><label htmlFor={name}>{label}{required && ' *'}</label>{type === 'textarea' ? <textarea {...attrs(name)} rows="5" maxLength={max} value={values[name] ?? ''} onChange={e => change(name, e.target.value)}/> : <input {...attrs(name)} type={type === 'price' ? 'number' : 'text'} min={type === 'price' ? 0 : undefined} max={type === 'price' ? 2147483647 : undefined} step={type === 'price' ? 1 : undefined} disabled={type === 'price' && values.priceUnknown} maxLength={max || undefined} value={values[name] ?? ''} required={required && !(type === 'price' && values.priceUnknown)} onChange={e => change(name, e.target.value)}/>}</>}<FieldError name={name} errors={errors}/>{type === 'price' && <label className="checkbox-label"><input type="checkbox" checked={!!values.priceUnknown} onChange={e => change('priceUnknown', e.target.checked)}/>Giá chưa xác nhận (Hỏi quán)</label>}</div>)}
    {(resource === 'dishes' ? [['priceIsDemo', 'Giá demo cho bài tập'], ['recipeIsDemo', 'Đầu bếp / công thức là gợi ý demo']] : [['isDemo', 'Dữ liệu demo / minh họa']]).map(([name, label]) => <div className="field" key={name}><label className="checkbox-label"><input {...attrs(name)} type="checkbox" checked={!!values[name]} onChange={e => change(name, e.target.checked)}/>{label}</label><FieldError name={name} errors={errors}/></div>)}
    {resource === 'dishes' && <>{[['restaurantId', 'Quán phục vụ', restaurants, 'newRestaurantName', 'Tên quán mới'], ['chefId', 'Đầu bếp phụ trách', chefs, 'newChefName', 'Tên đầu bếp mới']].map(([name, label, options, newName, newLabel]) => <div className="field relation-card" key={name}><label htmlFor={name}>{label}</label><select {...attrs(name)} value={values[name]} onChange={e => { change(name, e.target.value); change(newName, ''); }}><option value="">Chưa gắn</option>{options.map(x => <option value={x.id} key={x.id}>{x.name}</option>)}</select><FieldError name={name} errors={errors}/><label htmlFor={newName}>{newLabel}</label><input {...attrs(newName)} maxLength="120" value={values[newName] || ''} onChange={e => { change(newName, e.target.value); if (e.target.value.trim()) change(name, ''); }}/><FieldError name={newName} errors={errors}/></div>)}<fieldset className="field" id="ingredientIds"><legend>Nguyên liệu</legend><div className="ingredient-checkboxes">{ingredients.map(x => <label className="checkbox-label" key={x.id}><input type="checkbox" checked={values.ingredientIds.includes(x.id)} onChange={e => change('ingredientIds', e.target.checked ? [...values.ingredientIds, x.id] : values.ingredientIds.filter(id => id !== x.id))}/>{x.name} ({x.unit})</label>)}</div><FieldError name="ingredientIds" errors={errors}/><div id="newIngredients">{newIngredients.map((row, i) => <div className="new-ingredient-row" key={i}><div><label htmlFor={`new-name-${i}`}>Tên nguyên liệu mới {i + 1}</label><input id={`new-name-${i}`} value={row.name} maxLength="120" onChange={e => setNewIngredients(rows => rows.map((x, index) => index === i ? { ...x, name: e.target.value } : x))}/></div><div><label htmlFor={`new-unit-${i}`}>Đơn vị {i + 1}</label><input id={`new-unit-${i}`} value={row.unit} maxLength="30" placeholder="phần" onChange={e => setNewIngredients(rows => rows.map((x, index) => index === i ? { ...x, unit: e.target.value } : x))}/></div><button type="button" aria-label={`Bỏ dòng nguyên liệu ${i + 1}`} onClick={() => setNewIngredients(rows => rows.filter((_, index) => index !== i))}>×</button></div>)}</div><button type="button" className="button outline small" disabled={newIngredients.length >= 20} onClick={() => setNewIngredients(rows => [...rows, { name: '', unit: '' }])}>+ Thêm nguyên liệu khác</button><FieldError name="newIngredients" errors={errors}/></fieldset></>}
    {['dishes', 'restaurants'].includes(resource) && <fieldset className="field dish-image-editor"><legend>Ảnh</legend><div className="form-actions">{[['url', 'Dùng URL'], ['file', 'Tải file từ máy']].map(([mode, label]) => <label key={mode}><input type="radio" name="imageMode" checked={imageMode === mode} onChange={() => { setImageMode(mode); setErrors(old => ({ ...old, imageFile: undefined, imagePath: undefined })); }}/>{label}</label>)}</div>{imageMode === 'url' ? <><label htmlFor="imagePath">URL ảnh (để trống để giữ ảnh cũ)</label><input key="image-url" {...attrs('imagePath')} type="url" list="image-choices" value={values.imagePath || ''} onChange={e => change('imagePath', e.target.value)}/><datalist id="image-choices">{config.imageChoices.map(x => <option key={x.path} value={x.path}>{x.label}</option>)}</datalist><FieldError name="imagePath" errors={errors}/></> : <><label htmlFor="imageFile">Ảnh JPG, PNG hoặc WebP, tối đa 5 MB</label><input key="image-file" {...attrs('imageFile')} type="file" accept="image/jpeg,image/png,image/webp" onChange={e => { setFile(e.target.files[0] || null); setErrors(old => ({ ...old, imageFile: undefined })); }}/><FieldError name="imageFile" errors={errors}/></>}<Picture className="image-editor-preview" src={imageMode === 'file' ? fileUrl || record?.imagePath : values.imagePath || record?.imagePath} fallback={resource === 'restaurants' ? '/images/restaurant.svg' : '/images/greens.svg'} alt="Xem trước ảnh"/><p className="image-hint">Chỉ dùng nguồn ảnh đã được cho phép. Chuyển chế độ khi chưa chọn ảnh mới sẽ giữ ảnh hiện tại.</p></fieldset>}
    <FieldError name="_form" errors={errors}/><div className="form-actions"><button className="button" type="submit" disabled={pending || config.preview || failure?.code === 'NOT_FOUND'}>{pending ? 'Đang lưu…' : editing ? 'Lưu thay đổi ↗' : 'Thêm bản ghi ↗'}</button><Link className="button outline" to={`/admin/${resource}`}>Hủy</Link></div></fieldset></form></section>;
}
