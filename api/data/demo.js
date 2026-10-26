export const imageChoices = [
  { path: '/images/noodles.svg', label: 'Minh họa món nước' },
  { path: '/images/rice.svg', label: 'Minh họa món cơm' },
  { path: '/images/rolls.svg', label: 'Minh họa cuốn & bánh' },
  { path: '/images/greens.svg', label: 'Minh họa rau xanh' },
];
const definitions = [
  ['Phở bò', 'Nước dùng thanh, bánh phở mềm và hương thơm của các loại gia vị. Một cách dịu dàng để bắt đầu ngày mới.', 65000, 'Món nước', true, 0],
  ['Cơm tấm Sài Gòn', 'Hạt cơm tấm, sườn nướng và chút mỡ hành. Hương vị thân thuộc trong nhịp sống thành phố.', 75000, 'Cơm', true, 1],
  ['Gỏi cuốn', 'Rau thơm, bún và phần nhân cuộn trong bánh tráng. Nhẹ nhàng và tươi mát.', 45000, 'Món cuốn', true, 2],
  ['Bún bò Huế', 'Bún và nước dùng đậm vị sả, dùng cùng rau thơm. Một chút ấm áp cho buổi chiều.', 70000, 'Món nước', true, 0],
  ['Bánh xèo', 'Bánh giòn vàng, ăn cùng rau xanh và nước chấm. Món ăn gợi nhớ những bữa cơm sum họp.', 85000, 'Bánh', true, 2],
  ['Cơm gà', 'Cơm thơm dùng cùng gà và rau xanh, giản dị nhưng đủ đầy.', 80000, 'Cơm', true, 1],
  ['Hủ tiếu Nam Vang', 'Sợi hủ tiếu trong nước dùng thanh, thêm rau thơm và các loại topping.', 70000, 'Món nước', true, 0],
  ['Bún thịt nướng', 'Bún, rau sống và thịt nướng thơm, kết hợp nước chấm vừa vị.', 60000, 'Bún', true, 0],
  ['Gỏi rau mùa', 'Rau xanh theo mùa, kết hợp các loại hạt và nước trộn dịu nhẹ.', 55000, 'Món chay', true, 3],
  ['Bánh cuốn', 'Lớp bánh mềm cuốn nhân, dùng cùng rau thơm và nước chấm.', 50000, 'Bánh', false, 2],
  ['Xôi gà', 'Xôi dẻo và gà, thêm hành phi thơm. Bữa sáng gọn gàng, tròn vị.', 45000, 'Xôi', true, 1],
  ['Rau xào theo mùa', 'Rau theo mùa được chế biến đơn giản để giữ vị tươi tự nhiên.', 40000, 'Món chay', false, 3],
];
export const demoDishes = definitions.map(([name, description, price, category, available, image], index) => ({
  id: index + 1, name, description, price, category, available,
  imagePath: imageChoices[image].path, createdAt: new Date('2026-10-01T00:00:00Z'),
}));
export const demoChefs = [
  ['An Nguyễn', 'Ẩm thực Việt'], ['Minh Trần', 'Món nước'], ['Linh Phạm', 'Món chay'], ['Vy Lê', 'Bánh & món cuốn'],
].map(([name, specialty], index) => ({ id: index + 1, name, specialty, createdAt: new Date('2026-10-01T00:00:00Z') }));
export const demoIngredients = ['Gạo', 'Bánh phở', 'Bún', 'Thịt bò', 'Thịt gà', 'Thịt heo', 'Rau thơm', 'Sả', 'Bánh tráng', 'Nước mắm']
  .map((name, index) => ({ id: index + 1, name, unit: index === 9 ? 'ml' : 'g', createdAt: new Date('2026-10-01T00:00:00Z') }));
export const reviews = [
  { name: 'Mai An', location: 'Hà Nội', initials: 'MA', text: 'Một buổi sáng chậm lại, một bát phở nóng và những con phố đầy hương vị. Sài Gòn luôn có điều mới để khám phá.' },
  { name: 'Hải Minh', location: 'Đà Nẵng', initials: 'HM', text: 'Tôi thích cách một món ăn kể câu chuyện về nơi chốn. Từ cơm tấm đến gỏi cuốn, mỗi lựa chọn là một cảm hứng.' },
  { name: 'Linh Chi', location: 'Sài Gòn', initials: 'LC', text: 'Đôi khi hành trình thú vị nhất bắt đầu ngay trong thành phố mình sống. Một góc nhỏ và một hương vị thân quen.' },
  { name: 'Thảo Vy', location: 'Huế', initials: 'TV', text: 'Rau thơm, chút sả và nước dùng nóng. Những hương vị giản dị làm nên một ngày thật dễ chịu.' },
  { name: 'Quốc Nam', location: 'Cần Thơ', initials: 'QN', text: 'Thành phố rộng lớn, nhưng một bữa cơm ngon khiến mọi thứ gần gũi hơn. Tôi luôn muốn thử thêm một món mới.' },
  { name: 'Ngọc Hà', location: 'Hải Phòng', initials: 'NH', text: 'Một chiếc bánh giòn, một ly nước mát và cuộc trò chuyện dài. Những kỷ niệm đẹp thường đến từ điều nhỏ nhất.' },
];
