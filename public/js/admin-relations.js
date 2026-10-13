document.querySelectorAll('[data-relation-card]').forEach(card => {
  const select = card.querySelector('select');
  const input = card.querySelector('.relation-create input');
  input.addEventListener('input', () => { if (input.value.trim()) select.value = ''; });
  select.addEventListener('change', () => { if (select.value) input.value = ''; });
});
const ingredientRows = document.querySelector('[data-ingredient-rows]');
const addIngredient = document.querySelector('[data-add-ingredient]');
if (ingredientRows && addIngredient) {
  let counter = ingredientRows.children.length;
  function updateButton() { addIngredient.disabled = ingredientRows.children.length >= 20; }
  addIngredient.addEventListener('click', () => {
    if (ingredientRows.children.length >= 20) return;
    const row = ingredientRows.firstElementChild.cloneNode(true);
    row.querySelectorAll('input').forEach(input => {
      const label = row.querySelector(`label[for="${input.id}"]`);
      input.id = `${input.name}${counter}`;
      input.value = '';
      label.htmlFor = input.id;
    });
    counter++;
    ingredientRows.append(row);
    row.querySelector('input').focus();
    updateButton();
  });
  ingredientRows.addEventListener('click', event => {
    const button = event.target.closest('[data-remove-ingredient]');
    if (!button) return;
    const row = button.closest('.new-ingredient-row');
    if (ingredientRows.children.length === 1) row.querySelectorAll('input').forEach(input => { input.value = ''; });
    else row.remove();
    updateButton();
    addIngredient.focus();
  });
  updateButton();
}
