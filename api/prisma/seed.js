import { pathToFileURL } from 'node:url';
import { createDatabaseClient } from '../src/db/client.js';

// Snapshot read from Supabase on 2026-10-13. No credentials or system schemas.
// Run against a NEW database after db:push. IDs preserve all existing relations.
// Images are URLs/paths, not embedded files; referenced Storage remains external.
export const seedData = {
  "restaurant": [
    {
      "id": 1,
      "name": "Phở Minh (Sài Gòn)",
      "isDemo": false,
      "catalogKey": null,
      "address": "63/6 Pasteur Street, Saigon Ward, Ho Chi Minh City, 710000, Vietnam",
      "ward": "Saigon",
      "district": "Quận 1",
      "cuisine": "Noodles",
      "notableDishes": [
        "Phở bò",
        "Pâté chaud"
      ],
      "imagePath": "https://mia.vn/media/uploads/blog-du-lich/pho-minh-2-1720015378.jpg",
      "photoType": "Không gian quán",
      "priceMinVnd": 0,
      "priceMaxVnd": 150000,
      "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/pho-minh",
      "searchText": "pho minh sai gon 63 6 pasteur street saigon ward ho chi minh city 710000 vietnam saigon quan 1 noodles pho bo pate chaud mon nuoc pate chaud pho bo",
      "verifiedAt": "2026-10-12T12:59:11.147Z",
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 2,
      "name": "Xôi Gà Number One",
      "isDemo": false,
      "catalogKey": null,
      "address": "15 Nguyen Trung Truc Street, Ben Thanh Ward, Ho Chi Minh City, 700000, Vietnam",
      "ward": "Ben Thanh",
      "district": "Quận 1",
      "cuisine": "Street Food",
      "notableDishes": [
        "Xôi gà",
        "Xôi bắp"
      ],
      "imagePath": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/2d/b0/c0/b5/caption.jpg?h=1200&s=1&w=1200",
      "photoType": "Không gian quán",
      "priceMinVnd": 0,
      "priceMaxVnd": 150000,
      "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/xoi-ga-number-one",
      "searchText": "xoi ga number one 15 nguyen trung truc street ben thanh ward ho chi minh city 700000 vietnam ben thanh quan 1 street food xoi ga xoi bap mon an vat xoi bap xoi ga",
      "verifiedAt": "2026-10-12T12:59:11.147Z",
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 3,
      "name": "Hoa Túc (Sài Gòn)",
      "isDemo": false,
      "catalogKey": null,
      "address": "74/7 Hai Ba Trung Street, Saigon Ward, Ho Chi Minh City, 700000, Vietnam",
      "ward": "Saigon",
      "district": "Quận 1",
      "cuisine": "Vietnamese",
      "notableDishes": [
        "Gỏi bưởi tôm cua",
        "Bò lá lốt bánh hỏi"
      ],
      "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/89b96bc0e7b74eac97c00be6fe7de7b6.jpeg?format=webp&h=500&w=500",
      "photoType": "Không gian quán",
      "priceMinVnd": 150000,
      "priceMaxVnd": 500000,
      "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/hoa-tuc",
      "searchText": "hoa tuc sai gon 74 7 hai ba trung street saigon ward ho chi minh city 700000 vietnam saigon quan 1 vietnamese goi buoi tom cua bo la lot banh hoi am thuc viet bo la lot banh hoi goi buoi tom cua",
      "verifiedAt": "2026-10-12T12:59:11.147Z",
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 4,
      "name": "Vietnam House",
      "isDemo": false,
      "catalogKey": null,
      "address": "93-97 Dong Khoi Street, Saigon Ward, Ho Chi Minh City, 700000, Vietnam",
      "ward": "Saigon",
      "district": "Quận 1",
      "cuisine": "Vietnamese",
      "notableDishes": [
        "Mì vịt",
        "Gà nướng",
        "Tàu hũ"
      ],
      "imagePath": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/23/26/00/d4/main-lobby.jpg?h=-1&s=1&w=1200",
      "photoType": "Không gian quán",
      "priceMinVnd": 150000,
      "priceMaxVnd": 500000,
      "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/vietnam-house",
      "searchText": "vietnam house 93 97 dong khoi street saigon ward ho chi minh city 700000 vietnam saigon quan 1 vietnamese mi vit ga nuong tau hu am thuc viet ga nuong tau hu mi vit",
      "verifiedAt": "2026-10-12T12:59:11.147Z",
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 5,
      "name": "The Monkey Gallery Dining",
      "isDemo": false,
      "catalogKey": null,
      "address": "3F, 91 Mac Thi Buoi Street, Saigon Ward, Ho Chi Minh City, 700000, Vietnam",
      "ward": "Saigon",
      "district": "Quận 1",
      "cuisine": "Vietnamese Contemporary",
      "notableDishes": [],
      "imagePath": "https://axwwgrkdco.cloudimg.io/v7/__gmpics3__/fda9284a4dfe43a9846d8364ba96bcfa.jpeg?width=1000",
      "photoType": "Không gian quán",
      "priceMinVnd": 1000000,
      "priceMaxVnd": null,
      "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/the-monkey-gallery-dining",
      "searchText": "the monkey gallery dining 3f 91 mac thi buoi street saigon ward ho chi minh city 700000 vietnam saigon quan 1 vietnamese contemporary am thuc viet hien dai",
      "verifiedAt": "2026-10-12T12:59:11.147Z",
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 6,
      "name": "Bếp Mẹ ỉn (Le Thanh Ton Street)",
      "isDemo": false,
      "catalogKey": null,
      "address": "136 Le Thanh Ton Street, Ben Thanh Ward, Ho Chi Minh City, 700000, Vietnam",
      "ward": "Ben Thanh",
      "district": "Quận 1",
      "cuisine": "Vietnamese",
      "notableDishes": [
        "Bánh xèo tôm thịt",
        "Cơm chiên tôm trứng"
      ],
      "imagePath": "https://axwwgrkdco.cloudimg.io/v7/__gmpics__/a776aaba47bd459f988f7534c3b3e93d",
      "photoType": "Không gian quán",
      "priceMinVnd": 0,
      "priceMaxVnd": 150000,
      "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/bep-me-in-le-thanh-ton",
      "searchText": "bep me in le thanh ton street 136 le thanh ton street ben thanh ward ho chi minh city 700000 vietnam ben thanh quan 1 vietnamese banh xeo tom thit com chien tom trung am thuc viet com chien tom trung banh xeo tom thit",
      "verifiedAt": "2026-10-12T12:59:11.147Z",
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 7,
      "name": "Ănăn Saigon",
      "isDemo": false,
      "catalogKey": null,
      "address": "89 Ton That Dam Street, Saigon Ward, Ho Chi Minh City, 710000, Vietnam",
      "ward": "Saigon",
      "district": "Quận 1",
      "cuisine": "Vietnamese Contemporary",
      "notableDishes": [
        "Chả giò gan ngỗng",
        "Chả cá Hà Nội",
        "Bánh mì bò Wagyu"
      ],
      "imagePath": "https://images.squarespace-cdn.com/content/v1/5d7f2d797a64971f017f10ff/1582022495940-NOODANEQU1UFGPY9P4XQ/05-18%2BSAIGON%2BTRIP%2B-%2BANAN%2BAP2.png?format=1000w",
      "photoType": "Không gian quán",
      "priceMinVnd": 150000,
      "priceMaxVnd": 500000,
      "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/anan-saigon",
      "searchText": "anan saigon 89 ton that dam street saigon ward ho chi minh city 710000 vietnam saigon quan 1 vietnamese contemporary cha gio gan ngong cha ca ha noi banh mi bo wagyu am thuc viet hien dai cha ca ha noi banh mi bo wagyu cha gio gan ngong",
      "verifiedAt": "2026-10-12T12:59:11.147Z",
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 8,
      "name": "Rice Field",
      "isDemo": false,
      "catalogKey": null,
      "address": "2F, 75-77 Ho Tung Mau Street, Saigon Ward, Ho Chi Minh City, 700000, Vietnam",
      "ward": "Saigon",
      "district": "Quận 1",
      "cuisine": "Vietnamese",
      "notableDishes": [
        "Ốc nhồi thịt hấp sả",
        "Chả cá Lã Vọng"
      ],
      "imagePath": "https://d1u7goitqk7klj.cloudfront.net/f529fjcr5ayxauyzrb7k3y3rw228",
      "photoType": "Không gian quán",
      "priceMinVnd": 150000,
      "priceMaxVnd": 500000,
      "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/rice-field",
      "searchText": "rice field 2f 75 77 ho tung mau street saigon ward ho chi minh city 700000 vietnam saigon quan 1 vietnamese oc nhoi thit hap sa cha ca la vong am thuc viet cha ca la vong oc nhoi thit hap sa",
      "verifiedAt": "2026-10-12T12:59:11.147Z",
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 9,
      "name": "Phở Việt Nam (Bến Thành)",
      "isDemo": false,
      "catalogKey": null,
      "address": "14 Pham Hong Thai Street, Ben Thanh Ward, Ho Chi Minh City, 71009, Vietnam",
      "ward": "Ben Thanh",
      "district": "Quận 1",
      "cuisine": "Noodles",
      "notableDishes": [
        "Phở bò",
        "Phở thố đá"
      ],
      "imagePath": "https://hotel84.com/hotel84-images/news/photo/14-pham-hong-thai-pho-viet-.jpg",
      "photoType": "Không gian quán",
      "priceMinVnd": 0,
      "priceMaxVnd": 150000,
      "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/pho-viet-nam-district-1",
      "searchText": "pho viet nam ben thanh 14 pham hong thai street ben thanh ward ho chi minh city 71009 vietnam ben thanh quan 1 noodles pho bo pho tho da mon nuoc pho tho da pho bo",
      "verifiedAt": "2026-10-12T12:59:11.147Z",
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 10,
      "name": "Bà Cô Lốc Cốc",
      "isDemo": false,
      "catalogKey": null,
      "address": "40A Tran Cao Van Street, Xuan Hoa Ward, Ho Chi Minh City, 722700, Vietnam",
      "ward": "Xuan Hoa",
      "district": "Quận 3",
      "cuisine": "Fish and Seafood",
      "notableDishes": [
        "Ốc nấu nước cốt dừa",
        "Ốc hấp tiêu xanh",
        "Ốc hấp gừng sả"
      ],
      "imagePath": "https://pasgo.vn/Upload/anh-chi-tiet/nha-hang-ba-co-loc-coc-tran-cao-van-10-normal-2206787253393.webp",
      "photoType": "Không gian quán",
      "priceMinVnd": 150000,
      "priceMaxVnd": 500000,
      "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/ba-co-loc-coc",
      "searchText": "ba co loc coc 40a tran cao van street xuan hoa ward ho chi minh city 722700 vietnam xuan hoa quan 3 fish and seafood oc nau nuoc cot dua oc hap tieu xanh oc hap gung sa ca hai san oc hap tieu xanh oc hap gung sa oc nau nuoc cot dua",
      "verifiedAt": "2026-10-12T12:59:11.147Z",
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 11,
      "name": "Béo Ơi",
      "isDemo": false,
      "catalogKey": null,
      "address": "15/20 Nguyen Thi Minh Khai Street, Saigon Ward, Ho Chi Minh City, 700000, Vietnam",
      "ward": "Saigon",
      "district": "Quận 1",
      "cuisine": "Vietnamese",
      "notableDishes": [
        "Bún riêu cua"
      ],
      "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/f34dc5dd96a044e49bfed0112a77bb65.jpeg?format=webp&h=500&w=500",
      "photoType": "Không gian quán",
      "priceMinVnd": 0,
      "priceMaxVnd": 150000,
      "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/beo-oi",
      "searchText": "beo oi 15 20 nguyen thi minh khai street saigon ward ho chi minh city 700000 vietnam saigon quan 1 vietnamese bun rieu cua am thuc viet bun rieu cua",
      "verifiedAt": "2026-10-12T12:59:11.147Z",
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 12,
      "name": "Bờm",
      "isDemo": false,
      "catalogKey": null,
      "address": "24 Nguyen Thi Nghia Street, Ben Thanh Ward, Ho Chi Minh City, 71009, Vietnam",
      "ward": "Ben Thanh",
      "district": "Quận 1",
      "cuisine": "Vietnamese Contemporary",
      "notableDishes": [
        "Bánh tart bò kho",
        "Chả ốc",
        "Mochi mè đen"
      ],
      "imagePath": "https://axwwgrkdco.cloudimg.io/v7/__gmpics3__/14bdee3bd7b34011a010a52d0acce011.png",
      "photoType": "Không gian quán",
      "priceMinVnd": 150000,
      "priceMaxVnd": 500000,
      "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/bom-1205510",
      "searchText": "bom 24 nguyen thi nghia street ben thanh ward ho chi minh city 71009 vietnam ben thanh quan 1 vietnamese contemporary banh tart bo kho cha oc mochi me den am thuc viet hien dai cha oc mochi me den banh tart bo kho",
      "verifiedAt": "2026-10-12T12:59:11.147Z",
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 13,
      "name": "Chay Garden (Xuan Hoa)",
      "isDemo": false,
      "catalogKey": null,
      "address": "52 Vo Van Tan Street, Xuan Hoa Ward, Ho Chi Minh City, 700000, Vietnam",
      "ward": "Xuan Hoa",
      "district": "Quận 3",
      "cuisine": "Vegetarian",
      "notableDishes": [
        "Cà tím kho chuối và đậu xanh"
      ],
      "imagePath": "https://pasgo.vn/Upload/anh-chi-tiet/nha-hang-chay-garden-vo-van-tan-10-normal-2112668238586.webp",
      "photoType": "Không gian quán",
      "priceMinVnd": 0,
      "priceMaxVnd": 150000,
      "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/chay-garden",
      "searchText": "chay garden xuan hoa 52 vo van tan street xuan hoa ward ho chi minh city 700000 vietnam xuan hoa quan 3 vegetarian ca tim kho chuoi va dau xanh mon chay rau chay ca tim kho chuoi va dau xanh",
      "verifiedAt": "2026-10-12T12:59:11.147Z",
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 14,
      "name": "Nhà Tú",
      "isDemo": false,
      "catalogKey": null,
      "address": "129/4 Vo Van Tan Street, Xuan Hoa Ward, Ho Chi Minh City, 722700, Vietnam",
      "ward": "Xuan Hoa",
      "district": "Quận 3",
      "cuisine": "Vietnamese",
      "notableDishes": [
        "Ốc nhồi thịt hấp sả",
        "Rau chấm kho quẹt"
      ],
      "imagePath": "https://cafefcdn.com/203337114487263232/2024/9/21/nha-tu-3-14450966-1726889843254-1726889843357171899868.jpg",
      "photoType": "Không gian quán",
      "priceMinVnd": 0,
      "priceMaxVnd": 150000,
      "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/nha-tu",
      "searchText": "nha tu 129 4 vo van tan street xuan hoa ward ho chi minh city 722700 vietnam xuan hoa quan 3 vietnamese oc nhoi thit hap sa rau cham kho quet am thuc viet rau cham kho quet oc nhoi thit hap sa",
      "verifiedAt": "2026-10-12T12:59:11.147Z",
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 15,
      "name": "Đông Phố",
      "isDemo": false,
      "catalogKey": null,
      "address": "57 Ho Xuan Huong Street, Xuan Hoa Ward, Ho Chi Minh City, 72407, Vietnam",
      "ward": "Xuan Hoa",
      "district": "Quận 3",
      "cuisine": "Vietnamese",
      "notableDishes": [
        "Chả giò thập cẩm"
      ],
      "imagePath": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/05/ba/ce/d2/cosy-interior.jpg?h=400&s=1&w=500",
      "photoType": "Không gian quán",
      "priceMinVnd": 150000,
      "priceMaxVnd": 500000,
      "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/%C4%91ong-pho",
      "searchText": "dong pho 57 ho xuan huong street xuan hoa ward ho chi minh city 72407 vietnam xuan hoa quan 3 vietnamese cha gio thap cam am thuc viet cha gio thap cam",
      "verifiedAt": "2026-10-12T12:59:11.147Z",
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 16,
      "name": "Cô Liêng",
      "isDemo": false,
      "catalogKey": null,
      "address": "321 Vo Van Tan Street, Ban Co Ward, Ho Chi Minh City, 72407, Vietnam",
      "ward": "Ban Co",
      "district": "Quận 3",
      "cuisine": "Vietnamese",
      "notableDishes": [
        "Bò lá lốt",
        "Bánh hỏi thịt nướng"
      ],
      "imagePath": "https://kenh14cdn.com/203336854389633024/2023/6/28/photo-5-1687949327483478272654.jpg",
      "photoType": "Không gian quán",
      "priceMinVnd": 0,
      "priceMaxVnd": 150000,
      "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/co-lieng",
      "searchText": "co lieng 321 vo van tan street ban co ward ho chi minh city 72407 vietnam ban co quan 3 vietnamese bo la lot banh hoi thit nuong am thuc viet banh hoi thit nuong bo la lot",
      "verifiedAt": "2026-10-12T12:59:11.147Z",
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 17,
      "name": "Thúy 94 Cũ",
      "isDemo": false,
      "catalogKey": null,
      "address": "84 Dinh Tien Hoang Street, Saigon Ward, Ho Chi Minh City, 710000, Vietnam",
      "ward": "Saigon",
      "district": "Quận 1",
      "cuisine": "Seafood",
      "notableDishes": [
        "Chả giò cua",
        "Cơm chiên cua",
        "Miến cua"
      ],
      "imagePath": "https://down-vn.img.susercontent.com/vn-11134259-7r98o-lw8zem0vlyor58%40resize_w800",
      "photoType": "Không gian quán",
      "priceMinVnd": 150000,
      "priceMaxVnd": 500000,
      "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/thuy-94-cu",
      "searchText": "thuy 94 cu 84 dinh tien hoang street saigon ward ho chi minh city 710000 vietnam saigon quan 1 seafood cha gio cua com chien cua mien cua hai san com chien cua mien cua cha gio cua",
      "verifiedAt": "2026-10-12T12:59:11.147Z",
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 18,
      "name": "Hoi An Sense",
      "isDemo": false,
      "catalogKey": null,
      "address": "6F, 12 Phan Ke Binh, Tan Dinh Ward, Ho Chi Minh City, 700000, Vietnam",
      "ward": "Tan Dinh",
      "district": "Quận 1",
      "cuisine": "Vietnamese",
      "notableDishes": [
        "Cuốn thịt heo tôm chua",
        "Cá chẽm cuộn ba rọi nướng sả"
      ],
      "imagePath": "https://res.klook.com/image/upload/w_750%2Ch_469%2Cc_fill%2Cq_85/w_80%2Cx_15%2Cy_15%2Cg_south_west%2Cl_Klook_water_br_trans_yhcmh3/activities/tuqkb8pjz3z35h5k7vxl.jpg",
      "photoType": "Không gian quán",
      "priceMinVnd": 150000,
      "priceMaxVnd": 500000,
      "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/hoi-an-sense",
      "searchText": "hoi an sense 6f 12 phan ke binh tan dinh ward ho chi minh city 700000 vietnam tan dinh quan 1 vietnamese cuon thit heo tom chua ca chem cuon ba roi nuong sa am thuc viet ca chem cuon ba roi nuong sa cuon thit heo tom chua",
      "verifiedAt": "2026-10-12T12:59:11.147Z",
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 19,
      "name": "Phở Hương Bình",
      "isDemo": false,
      "catalogKey": null,
      "address": "148 Vo Thi Sau Street, Xuan Hoa Ward, Ho Chi Minh City, 700000, Vietnam",
      "ward": "Xuan Hoa",
      "district": "Quận 3",
      "cuisine": "Noodles",
      "notableDishes": [
        "Phở gà",
        "Phở bò"
      ],
      "imagePath": "https://static.wixstatic.com/media/69e2df_66f079d1d2fb4fcdb57b06cc0752401e~mv2.jpg/v1/fill/w_1000%2Ch_781%2Cal_c%2Cq_85%2Cusm_0.66_1.00_0.01/69e2df_66f079d1d2fb4fcdb57b06cc0752401e~mv2.jpg",
      "photoType": "Không gian quán",
      "priceMinVnd": 0,
      "priceMaxVnd": 150000,
      "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/pho-huong-binh",
      "searchText": "pho huong binh 148 vo thi sau street xuan hoa ward ho chi minh city 700000 vietnam xuan hoa quan 3 noodles pho ga pho bo mon nuoc pho ga pho bo",
      "verifiedAt": "2026-10-12T12:59:11.147Z",
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 20,
      "name": "Bánh Cuốn Tây Hồ 127",
      "isDemo": false,
      "catalogKey": null,
      "address": "127 Dinh Tien Hoang Street, Tan Dinh Ward, Ho Chi Minh City, 710000, Vietnam",
      "ward": "Tan Dinh",
      "district": "Quận 1",
      "cuisine": "Vietnamese",
      "notableDishes": [
        "Bánh cuốn thịt",
        "Bánh cuốn chay",
        "Bánh đậu chiên"
      ],
      "imagePath": "https://media.phunumoi.net.vn/files/hoanguyen/2021/07/20/quan-banh-cu-n-tay-h-1354-033629.jpg",
      "photoType": "Không gian quán",
      "priceMinVnd": 0,
      "priceMaxVnd": 150000,
      "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/banh-cuon-tay-ho-127",
      "searchText": "banh cuon tay ho 127 127 dinh tien hoang street tan dinh ward ho chi minh city 710000 vietnam tan dinh quan 1 vietnamese banh cuon thit banh cuon chay banh dau chien am thuc viet banh cuon thit banh cuon chay",
      "verifiedAt": "2026-10-12T12:59:11.147Z",
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 21,
      "name": "Bún Bò Huế Cô Như",
      "isDemo": false,
      "catalogKey": null,
      "address": "274/29 Vo Van Tan Street, Ban Co Ward, Ho Chi Minh City, 722700, Vietnam",
      "ward": "Ban Co",
      "district": "Quận 3",
      "cuisine": "Noodles",
      "notableDishes": [
        "Bún bò thập cẩm"
      ],
      "imagePath": "https://cafefcdn.com/203337114487263232/2024/7/5/batchdsc06283-17199988426641490240493-1720153214193-1720153214825793695061.jpg",
      "photoType": "Không gian quán",
      "priceMinVnd": 0,
      "priceMaxVnd": 150000,
      "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/bun-bo-hue-co-nhu",
      "searchText": "bun bo hue co nhu 274 29 vo van tan street ban co ward ho chi minh city 722700 vietnam ban co quan 3 noodles bun bo thap cam mon nuoc bun bo thap cam",
      "verifiedAt": "2026-10-12T12:59:11.147Z",
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 22,
      "name": "Phở Phượng",
      "isDemo": false,
      "catalogKey": null,
      "address": "25 Hoang Sa Street, Saigon Ward, Ho Chi Minh City, 71007, Vietnam",
      "ward": "Saigon",
      "district": "Quận 1",
      "cuisine": "Street Food",
      "notableDishes": [
        "Phở bò",
        "Phở đuôi bò"
      ],
      "imagePath": "https://d1u7goitqk7klj.cloudfront.net/kl02axy2lydu84oulk3a4101yc9b",
      "photoType": "Không gian quán",
      "priceMinVnd": 0,
      "priceMaxVnd": 150000,
      "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/pho-phuong",
      "searchText": "pho phuong 25 hoang sa street saigon ward ho chi minh city 71007 vietnam saigon quan 1 street food pho bo pho duoi bo mon an vat pho bo pho duoi bo",
      "verifiedAt": "2026-10-12T12:59:11.147Z",
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 23,
      "name": "Ốc Oanh",
      "isDemo": false,
      "catalogKey": null,
      "address": "534 Vinh Khanh Street, Khanh Hoi Ward, Ho Chi Minh City, 754000, Vietnam",
      "ward": "Khanh Hoi",
      "district": "Quận 4",
      "cuisine": "Street Food",
      "notableDishes": [
        "Hải sản"
      ],
      "imagePath": "https://mia.vn/media/uploads/blog-du-lich/pho-am-thuc-vinh-khanh-oc-oanh-1707245308.jpg",
      "photoType": "Không gian quán",
      "priceMinVnd": 150000,
      "priceMaxVnd": 500000,
      "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/oc-oanh",
      "searchText": "oc oanh 534 vinh khanh street khanh hoi ward ho chi minh city 754000 vietnam khanh hoi quan 4 street food hai san mon an vat",
      "verifiedAt": "2026-10-12T12:59:11.147Z",
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 24,
      "name": "Bánh Xèo 46A",
      "isDemo": false,
      "catalogKey": null,
      "address": "46 Dinh Cong Trang Street, Tan Dinh Ward, Ho Chi Minh City, 710776, Vietnam",
      "ward": "Tan Dinh",
      "district": "Quận 1",
      "cuisine": "Vietnamese",
      "notableDishes": [
        "Bánh xèo",
        "Gỏi gà xé"
      ],
      "imagePath": "https://cdn.tgdd.vn/Files/2023/02/21/1511779/kham-pha-5-quan-an-via-he-sieu-hut-khach-tay-tai-sai-gon-202302211026448854.jpg",
      "photoType": "Không gian quán",
      "priceMinVnd": 0,
      "priceMaxVnd": 150000,
      "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/banh-xeo-46a",
      "searchText": "banh xeo 46a 46 dinh cong trang street tan dinh ward ho chi minh city 710776 vietnam tan dinh quan 1 vietnamese banh xeo goi ga xe am thuc viet banh xeo goi ga xe",
      "verifiedAt": "2026-10-12T12:59:11.147Z",
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 25,
      "name": "Bếp Người Hội An",
      "isDemo": false,
      "catalogKey": null,
      "address": "22 Tran Quoc Toan Street, Xuan Hoa Ward, Ho Chi Minh City, 72408, Vietnam",
      "ward": "Xuan Hoa",
      "district": "Quận 3",
      "cuisine": "Vietnamese",
      "notableDishes": [
        "Mì Quảng đặc biệt",
        "Cơm gà xé"
      ],
      "imagePath": "https://down-vn.img.susercontent.com/vn-11134259-7r98o-lwa16l4rvtnd51%40resize_w800",
      "photoType": "Không gian quán",
      "priceMinVnd": 0,
      "priceMaxVnd": 150000,
      "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/bep-nguoi-hoi-an",
      "searchText": "bep nguoi hoi an 22 tran quoc toan street xuan hoa ward ho chi minh city 72408 vietnam xuan hoa quan 3 vietnamese mi quang dac biet com ga xe am thuc viet mi quang dac biet com ga xe",
      "verifiedAt": "2026-10-12T12:59:11.147Z",
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 26,
      "name": "Hồng Phát (Bàn Cờ)",
      "isDemo": false,
      "catalogKey": null,
      "address": "389-391 Vo Van Tan Street, Ban Co Ward, Ho Chi Minh City, 70000, Vietnam",
      "ward": "Ban Co",
      "district": "Quận 3",
      "cuisine": "Noodles",
      "notableDishes": [
        "Hủ tiếu Hồng Phát",
        "Chả giò tôm cua",
        "Sủi cảo chiên"
      ],
      "imagePath": "https://www.cathaypacific.com/content/dam/focal-point/cx/inspiration/2025/07/The_best_restaurants_in_Ho_Chi_Minh_City_to_book_now-Hong_Phat_Exterior-Credit_Hu_Tieu_Hong_Phat-1.renditionimage.900.600.jpg",
      "photoType": "Không gian quán",
      "priceMinVnd": 0,
      "priceMaxVnd": 150000,
      "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/hong-phat-district-3",
      "searchText": "hong phat ban co 389 391 vo van tan street ban co ward ho chi minh city 70000 vietnam ban co quan 3 noodles hu tieu hong phat cha gio tom cua sui cao chien mon nuoc hu tieu hong phat cha gio tom cua",
      "verifiedAt": "2026-10-12T12:59:11.147Z",
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 27,
      "name": "Phở Hùng (Cầu Ông Lãnh)",
      "isDemo": false,
      "catalogKey": null,
      "address": "241-243 Nguyen Trai Street, Cau Ong Lanh Ward, Ho Chi Minh City, 71014, Vietnam",
      "ward": "Cau Ong Lanh",
      "district": "Quận 1",
      "cuisine": "Noodles",
      "notableDishes": [
        "Phở bò",
        "Phở bò viên"
      ],
      "imagePath": "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/2d/56/61/db/caption.jpg?h=1100&s=1&w=1100",
      "photoType": "Không gian quán",
      "priceMinVnd": 0,
      "priceMaxVnd": 150000,
      "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/pho-hung",
      "searchText": "pho hung cau ong lanh 241 243 nguyen trai street cau ong lanh ward ho chi minh city 71014 vietnam cau ong lanh quan 1 noodles pho bo pho bo vien mon nuoc pho bo vien pho bo",
      "verifiedAt": "2026-10-12T12:59:11.147Z",
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 28,
      "name": "Bún Bò Huế 14B",
      "isDemo": false,
      "catalogKey": null,
      "address": "14B Street 46, Vinh Hoi Ward, Ho Chi Minh City, 754000, Vietnam",
      "ward": "Vinh Hoi",
      "district": "Quận 4",
      "cuisine": "Street Food",
      "notableDishes": [
        "Bún bò Huế"
      ],
      "imagePath": "https://cafefcdn.com/203337114487263232/2024/8/16/quan-bun-bo-14b-14483163-1723781737686-17237817378901195315018.jpg",
      "photoType": "Không gian quán",
      "priceMinVnd": 0,
      "priceMaxVnd": 150000,
      "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/bun-bo-hue-14b",
      "searchText": "bun bo hue 14b 14b street 46 vinh hoi ward ho chi minh city 754000 vietnam vinh hoi quan 4 street food bun bo hue mon an vat bun bo hue",
      "verifiedAt": "2026-10-12T12:59:11.147Z",
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 29,
      "name": "Phở Chào",
      "isDemo": false,
      "catalogKey": null,
      "address": "52 Nguyen Cong Tru Street, Thanh My Tay Ward, Ho Chi Minh City, 72323, Vietnam",
      "ward": "Thanh My Tay",
      "district": "Bình Thạnh",
      "cuisine": "Noodles",
      "notableDishes": [
        "Phở bắp hoa",
        "Gà tôm mắm sốt",
        "Phở tine"
      ],
      "imagePath": "https://axwwgrkdco.cloudimg.io/v7/__gmpics__/61ce07161c2b4cd185be3a84838b8bbf",
      "photoType": "Không gian quán",
      "priceMinVnd": 0,
      "priceMaxVnd": 150000,
      "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/pho-chao",
      "searchText": "pho chao 52 nguyen cong tru street thanh my tay ward ho chi minh city 72323 vietnam thanh my tay binh thanh noodles pho bap hoa ga tom mam sot pho tine mon nuoc pho bap hoa pho tine",
      "verifiedAt": "2026-10-12T12:59:11.147Z",
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 30,
      "name": "Tiệm Cơm Thố Chuyên Ký",
      "isDemo": false,
      "catalogKey": null,
      "address": "67 Ton That Dam Street, Saigon Ward, Ho Chi Minh City, 70000, Vietnam",
      "ward": "Saigon",
      "district": "Quận 1",
      "cuisine": "Cantonese",
      "notableDishes": [
        "Canh gà ác tiềm",
        "Cơm thố bò",
        "Cơm thố gà"
      ],
      "imagePath": "https://afamilycdn.com/150157425591193600/2024/10/5/chuyen-ky-1-22504446-1728091342202-1728091342986384667774-1728102309544-17281023097001957093708.jpg",
      "photoType": "Không gian quán",
      "priceMinVnd": 0,
      "priceMaxVnd": 150000,
      "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/tiem-com-tho-chuyen-ky",
      "searchText": "tiem com tho chuyen ky 67 ton that dam street saigon ward ho chi minh city 70000 vietnam saigon quan 1 cantonese canh ga ac tiem com tho bo com tho ga mon hoa quang dong canh ga ac tiem com tho ga",
      "verifiedAt": "2026-10-12T12:59:11.147Z",
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 31,
      "name": "Quán ăn Ngự Bình",
      "isDemo": false,
      "catalogKey": null,
      "address": "82 Cu Xa Nguyen Van Troi Street, Phu Nhuan Ward, Ho Chi Minh City, 700000, Vietnam",
      "ward": "Phu Nhuan",
      "district": "Phú Nhuận",
      "cuisine": "Vietnamese",
      "notableDishes": [
        "Bún bò Huế",
        "Bánh bèo",
        "Nem nướng"
      ],
      "imagePath": "https://mia.vn/media/uploads/blog-du-lich/quan-hue-ngu-binh-1753749313.jpg",
      "photoType": "Không gian quán",
      "priceMinVnd": 0,
      "priceMaxVnd": 150000,
      "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/quan-an-ngu-binh",
      "searchText": "quan an ngu binh 82 cu xa nguyen van troi street phu nhuan ward ho chi minh city 700000 vietnam phu nhuan phu nhuan vietnamese bun bo hue banh beo nem nuong am thuc viet bun bo hue banh beo nem nuong",
      "verifiedAt": "2026-10-12T12:59:11.147Z",
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 32,
      "name": "Little Bear",
      "isDemo": false,
      "catalogKey": null,
      "address": "36 Nguyen Ba Huan Street, An Khanh Ward, Ho Chi Minh City, 70000, Vietnam",
      "ward": "An Khanh",
      "district": "Thủ Đức (khu vực Quận 2)",
      "cuisine": "Vietnamese Contemporary",
      "notableDishes": [],
      "imagePath": "https://littlebearsgn.com/wp-content/uploads/2023/11/LB_16-2-1024x682.webp",
      "photoType": "Không gian quán",
      "priceMinVnd": 150000,
      "priceMaxVnd": 500000,
      "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/little-bear-1212889",
      "searchText": "little bear 36 nguyen ba huan street an khanh ward ho chi minh city 70000 vietnam an khanh thu duc khu vuc quan 2 vietnamese contemporary am thuc viet hien dai",
      "verifiedAt": "2026-10-12T12:59:11.147Z",
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 33,
      "name": "Phở Bò Phú Gia (Nhiêu Lộc)",
      "isDemo": false,
      "catalogKey": null,
      "address": "146E Ly Chinh Thang Street, Nhieu Loc Ward, Ho Chi Minh City, 722700, Vietnam",
      "ward": "Nhieu Loc",
      "district": "Quận 3",
      "cuisine": "Noodles",
      "notableDishes": [
        "Phở tái lăn",
        "Phở đặc biệt"
      ],
      "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/887431d6a26a4292b21f3cc2fe0c5e18.jpeg?format=webp&h=500&w=500",
      "photoType": "Không gian quán",
      "priceMinVnd": 0,
      "priceMaxVnd": 150000,
      "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/pho-bo-phu-gia",
      "searchText": "pho bo phu gia nhieu loc 146e ly chinh thang street nhieu loc ward ho chi minh city 722700 vietnam nhieu loc quan 3 noodles pho tai lan pho dac biet mon nuoc pho tai lan",
      "verifiedAt": "2026-10-12T12:59:11.147Z",
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 34,
      "name": "Bún Thịt Nướng Hoàng Văn",
      "isDemo": false,
      "catalogKey": null,
      "address": "137 Chan Hung Street, Tan Hoa Ward, Ho Chi Minh City, 736090, Vietnam",
      "ward": "Tan Hoa",
      "district": "Tân Bình",
      "cuisine": "Noodles",
      "notableDishes": [
        "Bún thịt nướng"
      ],
      "imagePath": "https://images2.thanhnien.vn/528068263637045248/2023/6/16/9473d7f60720d67e8f31-1686911981452479546941.jpg",
      "photoType": "Không gian quán",
      "priceMinVnd": 0,
      "priceMaxVnd": 150000,
      "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/bun-thit-nuong-hoang-van",
      "searchText": "bun thit nuong hoang van 137 chan hung street tan hoa ward ho chi minh city 736090 vietnam tan hoa tan binh noodles bun thit nuong mon nuoc bun thit nuong",
      "verifiedAt": "2026-10-12T12:59:11.147Z",
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 35,
      "name": "Miên Saigon",
      "isDemo": false,
      "catalogKey": null,
      "address": "50A Dang Dung Street, Tan Dinh Ward, Ho Chi Minh City, 710880, Vietnam",
      "ward": "Tan Dinh",
      "district": "Quận 1",
      "cuisine": "Vietnamese Contemporary",
      "notableDishes": [],
      "imagePath": "https://www.frasersproperty.com/content/dam/frasersproperty/feature/project/frasers-vn/shared-experience/mien-saigon-3.jpg",
      "photoType": "Không gian quán",
      "priceMinVnd": 1000000,
      "priceMaxVnd": null,
      "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/mien-saigon",
      "searchText": "mien saigon 50a dang dung street tan dinh ward ho chi minh city 710880 vietnam tan dinh quan 1 vietnamese contemporary am thuc viet hien dai",
      "verifiedAt": "2026-10-12T12:59:11.147Z",
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 36,
      "name": "Ốc Đào (Cầu Ông Lãnh)",
      "isDemo": false,
      "catalogKey": null,
      "address": "212B/D48 Nguyen Trai Street, Cau Ong Lanh Ward, Ho Chi Minh City, 71014, Vietnam",
      "ward": "Cau Ong Lanh",
      "district": "Quận 1",
      "cuisine": "Fish and Seafood",
      "notableDishes": [
        "Ốc xào bơ tỏi",
        "Ốc nướng muối"
      ],
      "imagePath": "https://media.vov.vn/sites/default/files/styles/large/public/2024-01/oc_dao.jpg",
      "photoType": "Không gian quán",
      "priceMinVnd": 0,
      "priceMaxVnd": 150000,
      "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/oc-%C4%91ao",
      "searchText": "oc dao cau ong lanh 212b d48 nguyen trai street cau ong lanh ward ho chi minh city 71014 vietnam cau ong lanh quan 1 fish and seafood oc xao bo toi oc nuong muoi ca hai san oc xao bo toi oc nuong muoi",
      "verifiedAt": "2026-10-12T12:59:11.147Z",
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 37,
      "name": "Bếp Quốc Tế",
      "isDemo": true,
      "catalogKey": "demo:international",
      "address": "Địa điểm hư cấu cho bài tập",
      "ward": "Khu vực minh họa",
      "district": "Quận 1",
      "cuisine": "Ẩm thực quốc tế",
      "notableDishes": [
        "Pizza phô mai sốt cà chua",
        "Salad rau xanh cà chua",
        "Salad bowl rau củ"
      ],
      "imagePath": "https://images.unsplash.com/photo-1667388969250-1c7220bf3f37?auto=format&fit=crop&w=1200&q=85",
      "photoType": "Không gian minh họa",
      "priceMinVnd": 45000,
      "priceMaxVnd": 165000,
      "michelinUrl": null,
      "searchText": "bep quoc te dia diem hu cau cho bai tap khu vuc minh hoa quan 1 am thuc quoc te pizza pho mai sot ca chua salad rau xanh ca chua salad bowl rau cu salad bowl rau cu pizza pho mai sot ca chua salad rau xanh ca chua salad bowl tong hop burger bo pho mai khoai tay chien sot kem khoai tay chien gion ga ran va khoai tay mi y penne sot ca chua pizza pepperoni sandwich rau cu banh mi kep goi cuon bun thit va rau thom",
      "verifiedAt": null,
      "createdAt": "2026-10-12T18:23:25.929Z"
    },
    {
      "id": 38,
      "name": "Bếp Hải Sản",
      "isDemo": true,
      "catalogKey": "demo:seafood",
      "address": "Địa điểm hư cấu cho bài tập",
      "ward": "Khu vực minh họa",
      "district": "Quận 4",
      "cuisine": "Hải sản",
      "notableDishes": [
        "Cá hồi áp chảo",
        "Tôm và rau củ",
        "Hàu với topping"
      ],
      "imagePath": "https://images.unsplash.com/photo-1662472458178-13ea0399f2b2?auto=format&fit=crop&w=1200&q=85",
      "photoType": "Không gian minh họa",
      "priceMinVnd": 95000,
      "priceMaxVnd": 220000,
      "michelinUrl": null,
      "searchText": "bep hai san dia diem hu cau cho bai tap khu vuc minh hoa quan 4 hai san ca hoi ap chao tom va rau cu hau voi topping ca hoi ap chao tom va rau cu hau voi topping hai san nuong tong hop ngheu hap chanh hai san trong vo so so diep ap chao",
      "verifiedAt": null,
      "createdAt": "2026-10-12T18:23:26.102Z"
    },
    {
      "id": 39,
      "name": "Góc Cà Phê",
      "isDemo": true,
      "catalogKey": "demo:cafe",
      "address": "Địa điểm hư cấu cho bài tập",
      "ward": "Khu vực minh họa",
      "district": "Quận 3",
      "cuisine": "Đồ uống & tráng miệng",
      "notableDishes": [
        "ice_cream",
        "Đồ uống trái cây tổng hợp",
        "Đồ uống chanh và trái cây"
      ],
      "imagePath": "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=85",
      "photoType": "Không gian minh họa",
      "priceMinVnd": 45000,
      "priceMaxVnd": 500000,
      "michelinUrl": null,
      "searchText": "goc ca phe dia diem hu cau cho bai tap khu vuc minh hoa quan 3 do uong trang mieng ice cream do uong trai cay tong hop do uong chanh va trai cay do uong trai cay tong hop do uong chanh va trai cay bia tuoi",
      "verifiedAt": null,
      "createdAt": "2026-10-12T18:23:26.268Z"
    }
  ],
  "chef": [
    {
      "id": 1,
      "name": "Nguyen van Phu",
      "specialty": "Ẩm thực Việt",
      "isDemo": false,
      "catalogKey": null,
      "createdAt": "2026-10-01T00:00:00.000Z"
    },
    {
      "id": 2,
      "name": "Minh Trần",
      "specialty": "Món nước",
      "isDemo": false,
      "catalogKey": null,
      "createdAt": "2026-10-01T00:00:00.000Z"
    },
    {
      "id": 3,
      "name": "Linh Phạm",
      "specialty": "Món chay",
      "isDemo": false,
      "catalogKey": null,
      "createdAt": "2026-10-01T00:00:00.000Z"
    },
    {
      "id": 4,
      "name": "Vy Lê",
      "specialty": "Bánh & món cuốn",
      "isDemo": false,
      "catalogKey": null,
      "createdAt": "2026-10-01T00:00:00.000Z"
    },
    {
      "id": 5,
      "name": "An Nguyễn",
      "specialty": "Món nước",
      "isDemo": true,
      "catalogKey": "demo:chef:0",
      "createdAt": "2026-10-12T18:23:26.437Z"
    },
    {
      "id": 6,
      "name": "Bình Lê",
      "specialty": "Cơm & xôi",
      "isDemo": true,
      "catalogKey": "demo:chef:1",
      "createdAt": "2026-10-12T18:23:26.606Z"
    },
    {
      "id": 7,
      "name": "Chi Trần",
      "specialty": "Bánh & món cuốn",
      "isDemo": true,
      "catalogKey": "demo:chef:2",
      "createdAt": "2026-10-12T18:23:26.781Z"
    },
    {
      "id": 8,
      "name": "Duy Phạm",
      "specialty": "Hải sản",
      "isDemo": true,
      "catalogKey": "demo:chef:3",
      "createdAt": "2026-10-12T18:23:26.965Z"
    },
    {
      "id": 9,
      "name": "Hà Vũ",
      "specialty": "Món chay",
      "isDemo": true,
      "catalogKey": "demo:chef:4",
      "createdAt": "2026-10-12T18:23:27.132Z"
    },
    {
      "id": 10,
      "name": "Khánh Đỗ",
      "specialty": "Ẩm thực quốc tế",
      "isDemo": true,
      "catalogKey": "demo:chef:5",
      "createdAt": "2026-10-12T18:23:27.300Z"
    },
    {
      "id": 11,
      "name": "Mai Lê",
      "specialty": "Đồ uống & tráng miệng",
      "isDemo": true,
      "catalogKey": "demo:chef:6",
      "createdAt": "2026-10-12T18:23:27.516Z"
    },
    {
      "id": 12,
      "name": "Nam Trần",
      "specialty": "Nướng & món chính",
      "isDemo": true,
      "catalogKey": "demo:chef:7",
      "createdAt": "2026-10-12T18:23:27.718Z"
    },
    {
      "id": 13,
      "name": "văn phú",
      "specialty": null,
      "isDemo": true,
      "catalogKey": null,
      "createdAt": "2026-10-13T05:02:15.215Z"
    }
  ],
  "ingredient": [
    {
      "id": 2,
      "name": "Bánh phở",
      "unit": "g",
      "isDemo": false,
      "catalogKey": null,
      "createdAt": "2026-10-01T00:00:00.000Z"
    },
    {
      "id": 3,
      "name": "Bún",
      "unit": "g",
      "isDemo": false,
      "catalogKey": null,
      "createdAt": "2026-10-01T00:00:00.000Z"
    },
    {
      "id": 4,
      "name": "Thịt bò",
      "unit": "g",
      "isDemo": false,
      "catalogKey": null,
      "createdAt": "2026-10-01T00:00:00.000Z"
    },
    {
      "id": 5,
      "name": "Thịt gà",
      "unit": "g",
      "isDemo": false,
      "catalogKey": null,
      "createdAt": "2026-10-01T00:00:00.000Z"
    },
    {
      "id": 6,
      "name": "Thịt heo",
      "unit": "g",
      "isDemo": false,
      "catalogKey": null,
      "createdAt": "2026-10-01T00:00:00.000Z"
    },
    {
      "id": 7,
      "name": "Rau thơm",
      "unit": "g",
      "isDemo": false,
      "catalogKey": null,
      "createdAt": "2026-10-01T00:00:00.000Z"
    },
    {
      "id": 8,
      "name": "Sả",
      "unit": "g",
      "isDemo": false,
      "catalogKey": null,
      "createdAt": "2026-10-01T00:00:00.000Z"
    },
    {
      "id": 9,
      "name": "Bánh tráng",
      "unit": "g",
      "isDemo": false,
      "catalogKey": null,
      "createdAt": "2026-10-01T00:00:00.000Z"
    },
    {
      "id": 10,
      "name": "Nước mắm",
      "unit": "ml",
      "isDemo": false,
      "catalogKey": null,
      "createdAt": "2026-10-01T00:00:00.000Z"
    },
    {
      "id": 11,
      "name": "Gạo",
      "unit": "g",
      "isDemo": false,
      "catalogKey": null,
      "createdAt": "2026-10-12T04:03:44.791Z"
    },
    {
      "id": 12,
      "name": "Tôm",
      "unit": "g",
      "isDemo": true,
      "catalogKey": "demo:ingredient:tom",
      "createdAt": "2026-10-12T18:23:28.705Z"
    },
    {
      "id": 13,
      "name": "Cua",
      "unit": "g",
      "isDemo": true,
      "catalogKey": "demo:ingredient:cua",
      "createdAt": "2026-10-12T18:23:28.993Z"
    },
    {
      "id": 14,
      "name": "Ốc",
      "unit": "g",
      "isDemo": true,
      "catalogKey": "demo:ingredient:oc",
      "createdAt": "2026-10-12T18:23:29.209Z"
    },
    {
      "id": 15,
      "name": "Cá",
      "unit": "g",
      "isDemo": true,
      "catalogKey": "demo:ingredient:ca",
      "createdAt": "2026-10-12T18:23:29.425Z"
    },
    {
      "id": 16,
      "name": "Cá hồi",
      "unit": "g",
      "isDemo": true,
      "catalogKey": "demo:ingredient:ca hoi",
      "createdAt": "2026-10-12T18:23:29.665Z"
    },
    {
      "id": 17,
      "name": "Sò điệp",
      "unit": "g",
      "isDemo": true,
      "catalogKey": "demo:ingredient:so diep",
      "createdAt": "2026-10-12T18:23:29.889Z"
    },
    {
      "id": 18,
      "name": "Hàu",
      "unit": "g",
      "isDemo": true,
      "catalogKey": "demo:ingredient:hau",
      "createdAt": "2026-10-12T18:23:30.113Z"
    },
    {
      "id": 19,
      "name": "Nghêu",
      "unit": "g",
      "isDemo": true,
      "catalogKey": "demo:ingredient:ngheu",
      "createdAt": "2026-10-12T18:23:30.384Z"
    },
    {
      "id": 20,
      "name": "Rau xanh",
      "unit": "g",
      "isDemo": true,
      "catalogKey": "demo:ingredient:rau xanh",
      "createdAt": "2026-10-12T18:23:30.600Z"
    },
    {
      "id": 21,
      "name": "Cà chua",
      "unit": "g",
      "isDemo": true,
      "catalogKey": "demo:ingredient:ca chua",
      "createdAt": "2026-10-12T18:23:30.831Z"
    },
    {
      "id": 22,
      "name": "Khoai tây",
      "unit": "g",
      "isDemo": true,
      "catalogKey": "demo:ingredient:khoai tay",
      "createdAt": "2026-10-12T18:23:31.041Z"
    },
    {
      "id": 23,
      "name": "Phô mai",
      "unit": "g",
      "isDemo": true,
      "catalogKey": "demo:ingredient:pho mai",
      "createdAt": "2026-10-12T18:23:31.260Z"
    },
    {
      "id": 24,
      "name": "Bột mì",
      "unit": "g",
      "isDemo": true,
      "catalogKey": "demo:ingredient:bot mi",
      "createdAt": "2026-10-12T18:23:31.504Z"
    },
    {
      "id": 25,
      "name": "Mì Ý",
      "unit": "g",
      "isDemo": true,
      "catalogKey": "demo:ingredient:mi y",
      "createdAt": "2026-10-12T18:23:31.759Z"
    },
    {
      "id": 26,
      "name": "Bánh mì",
      "unit": "g",
      "isDemo": true,
      "catalogKey": "demo:ingredient:banh mi",
      "createdAt": "2026-10-12T18:23:31.985Z"
    },
    {
      "id": 27,
      "name": "Trứng",
      "unit": "quả",
      "isDemo": true,
      "catalogKey": "demo:ingredient:trung",
      "createdAt": "2026-10-12T18:23:32.204Z"
    },
    {
      "id": 28,
      "name": "Đậu hũ",
      "unit": "g",
      "isDemo": true,
      "catalogKey": "demo:ingredient:dau hu",
      "createdAt": "2026-10-12T18:23:32.423Z"
    },
    {
      "id": 29,
      "name": "Mè đen",
      "unit": "g",
      "isDemo": true,
      "catalogKey": "demo:ingredient:me den",
      "createdAt": "2026-10-12T18:23:32.646Z"
    },
    {
      "id": 30,
      "name": "Bắp",
      "unit": "g",
      "isDemo": true,
      "catalogKey": "demo:ingredient:bap",
      "createdAt": "2026-10-12T18:23:32.867Z"
    },
    {
      "id": 31,
      "name": "Bưởi",
      "unit": "g",
      "isDemo": true,
      "catalogKey": "demo:ingredient:buoi",
      "createdAt": "2026-10-12T18:23:33.088Z"
    },
    {
      "id": 32,
      "name": "Đường",
      "unit": "g",
      "isDemo": true,
      "catalogKey": "demo:ingredient:duong",
      "createdAt": "2026-10-12T18:23:33.299Z"
    },
    {
      "id": 33,
      "name": "Chanh",
      "unit": "quả",
      "isDemo": true,
      "catalogKey": "demo:ingredient:chanh",
      "createdAt": "2026-10-12T18:23:33.572Z"
    },
    {
      "id": 34,
      "name": "Trái cây",
      "unit": "g",
      "isDemo": true,
      "catalogKey": "demo:ingredient:trai cay",
      "createdAt": "2026-10-12T18:23:33.788Z"
    },
    {
      "id": 35,
      "name": "Miến",
      "unit": "g",
      "isDemo": true,
      "catalogKey": "demo:ingredient:mien",
      "createdAt": "2026-10-12T18:23:34.012Z"
    },
    {
      "id": 36,
      "name": "Lá lốt",
      "unit": "g",
      "isDemo": true,
      "catalogKey": "demo:ingredient:la lot",
      "createdAt": "2026-10-12T18:23:34.244Z"
    },
    {
      "id": 37,
      "name": "Bột gạo",
      "unit": "g",
      "isDemo": true,
      "catalogKey": "demo:ingredient:bot gao",
      "createdAt": "2026-10-12T18:23:34.460Z"
    },
    {
      "id": 38,
      "name": "Gạo nếp",
      "unit": "g",
      "isDemo": true,
      "catalogKey": "demo:ingredient:gao nep",
      "createdAt": "2026-10-12T18:23:34.679Z"
    },
    {
      "id": 39,
      "name": "Tiêu xanh",
      "unit": "g",
      "isDemo": true,
      "catalogKey": "demo:ingredient:tieu xanh",
      "createdAt": "2026-10-12T18:23:34.890Z"
    },
    {
      "id": 40,
      "name": "Gừng",
      "unit": "g",
      "isDemo": true,
      "catalogKey": "demo:ingredient:gung",
      "createdAt": "2026-10-12T18:23:35.135Z"
    },
    {
      "id": 41,
      "name": "Nước cốt dừa",
      "unit": "ml",
      "isDemo": true,
      "catalogKey": "demo:ingredient:nuoc cot dua",
      "createdAt": "2026-10-12T18:23:35.372Z"
    },
    {
      "id": 42,
      "name": "Gan ngỗng",
      "unit": "g",
      "isDemo": true,
      "catalogKey": "demo:ingredient:gan ngong",
      "createdAt": "2026-10-12T18:23:35.592Z"
    },
    {
      "id": 43,
      "name": "Sữa",
      "unit": "ml",
      "isDemo": true,
      "catalogKey": "demo:ingredient:sua",
      "createdAt": "2026-10-12T18:23:35.810Z"
    },
    {
      "id": 44,
      "name": "Mạch nha",
      "unit": "g",
      "isDemo": true,
      "catalogKey": "demo:ingredient:mach nha",
      "createdAt": "2026-10-12T18:23:36.072Z"
    },
    {
      "id": 45,
      "name": "bột  mì",
      "unit": "g",
      "isDemo": true,
      "catalogKey": null,
      "createdAt": "2026-10-13T05:02:15.279Z"
    }
  ],
  "dish": [
    {
      "id": 40,
      "name": "Phở bò",
      "description": "Món được nhắc đến trong hồ sơ Michelin của quán; giá từng món chưa xác nhận.",
      "price": 65000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Món nước",
      "available": true,
      "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/8eff85a3241042d3b28c52b6a1bd26fb.jpg?format=webp&w=500&h=500",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh hồ sơ quán",
      "michelinUrl": null,
      "searchText": "pho bo mon nuoc",
      "importKey": "michelin:1:Phở bò",
      "restaurantId": 1,
      "chefId": 5,
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 41,
      "name": "Pâté chaud",
      "description": "Món được nhắc đến trong hồ sơ Michelin của quán; giá từng món chưa xác nhận.",
      "price": 120000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Món nước",
      "available": true,
      "imagePath": "https://images.food52.com/-cFKAMjJOop1_AEQJmhcD5eHwrQ%3D/fit-in/1200x1200/bec3067a-69b5-48b8-a4b0-b77d5c7253fd--pate_chaud.jpg",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh minh họa",
      "michelinUrl": null,
      "searchText": "pate chaud mon nuoc",
      "importKey": "michelin:1:Pâté chaud",
      "restaurantId": 1,
      "chefId": 7,
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 42,
      "name": "Xôi gà",
      "description": "Món được nhắc đến trong hồ sơ Michelin của quán; giá từng món chưa xác nhận.",
      "price": 75000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Ẩm thực đường phố",
      "available": true,
      "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/e2fc228b2fa3436ab4d6f03f60907b0f.jpeg?format=webp&w=500&h=500",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh hồ sơ quán",
      "michelinUrl": null,
      "searchText": "xoi ga am thuc duong pho",
      "importKey": "michelin:2:Xôi gà",
      "restaurantId": 2,
      "chefId": 6,
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 43,
      "name": "Xôi bắp",
      "description": "Món được nhắc đến trong hồ sơ Michelin của quán; giá từng món chưa xác nhận.",
      "price": 75000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Ẩm thực đường phố",
      "available": true,
      "imagePath": "https://img-global.cpcdn.com/recipes/bc71c49997968bfa/680x781cq80/xoi-b%E1%BA%AFp-recipe-main-photo.jpg",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh minh họa",
      "michelinUrl": null,
      "searchText": "xoi bap am thuc duong pho",
      "importKey": "michelin:2:Xôi bắp",
      "restaurantId": 2,
      "chefId": 6,
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 44,
      "name": "Gỏi bưởi tôm cua",
      "description": "Món được nhắc đến trong hồ sơ Michelin của quán; giá từng món chưa xác nhận.",
      "price": 120000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Món Việt",
      "available": true,
      "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/e5eb491180a145ca89d22a61734860fa.png?format=webp&w=500&h=500",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh hồ sơ quán",
      "michelinUrl": null,
      "searchText": "goi buoi tom cua mon viet",
      "importKey": "michelin:3:Gỏi bưởi tôm cua",
      "restaurantId": 3,
      "chefId": 8,
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 45,
      "name": "Bò lá lốt bánh hỏi",
      "description": "Món được nhắc đến trong hồ sơ Michelin của quán; giá từng món chưa xác nhận.",
      "price": 65000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Món Việt",
      "available": true,
      "imagePath": "https://product.hstatic.net/1000093072/product/bo_la_lot_971da047e0b1427889d1a061bd1b1fc5_master.jpg",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh minh họa",
      "michelinUrl": null,
      "searchText": "bo la lot banh hoi mon viet",
      "importKey": "michelin:3:Bò lá lốt bánh hỏi",
      "restaurantId": 3,
      "chefId": 7,
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 46,
      "name": "Mì vịt",
      "description": "Món được nhắc đến trong hồ sơ Michelin của quán; giá từng món chưa xác nhận.",
      "price": 65000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Món Việt",
      "available": true,
      "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/4a9b7c6b6bfe4c488f7fcf768ef65e6b.jpg?format=webp&w=500&h=500",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh hồ sơ quán",
      "michelinUrl": null,
      "searchText": "mi vit mon viet",
      "importKey": "michelin:4:Mì vịt",
      "restaurantId": 4,
      "chefId": 5,
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 47,
      "name": "Gà nướng",
      "description": "Món được nhắc đến trong hồ sơ Michelin của quán; giá từng món chưa xác nhận.",
      "price": 95000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Món Việt",
      "available": true,
      "imagePath": "https://vietnamtravel.com/images/2020/05/ga-nuong-768x410.jpg",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh minh họa",
      "michelinUrl": null,
      "searchText": "ga nuong mon viet",
      "importKey": "michelin:4:Gà nướng",
      "restaurantId": 4,
      "chefId": 12,
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 48,
      "name": "Tàu hũ",
      "description": "Món được nhắc đến trong hồ sơ Michelin của quán; giá từng món chưa xác nhận.",
      "price": 45000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Món Việt",
      "available": true,
      "imagePath": "https://cdn.hstatic.net/files/200000935481/file/tau-hu-nuoc-duong_43054ef1803d48f680e63e5acd685811.jpg",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh minh họa",
      "michelinUrl": null,
      "searchText": "tau hu mon viet",
      "importKey": "michelin:4:Tàu hũ",
      "restaurantId": 4,
      "chefId": 11,
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 49,
      "name": "Bánh xèo tôm thịt",
      "description": "Món được nhắc đến trong hồ sơ Michelin của quán; giá từng món chưa xác nhận.",
      "price": 120000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Món Việt",
      "available": true,
      "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/58ca3c105bc740f5bf4edca36bd831ac.jpeg?format=webp&w=500&h=500",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh hồ sơ quán",
      "michelinUrl": null,
      "searchText": "banh xeo tom thit mon viet",
      "importKey": "michelin:6:Bánh xèo tôm thịt",
      "restaurantId": 6,
      "chefId": 7,
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 50,
      "name": "Cơm chiên tôm trứng",
      "description": "Món được nhắc đến trong hồ sơ Michelin của quán; giá từng món chưa xác nhận.",
      "price": 120000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Món Việt",
      "available": true,
      "imagePath": "https://cdn.tgdd.vn/2021/10/CookDishThumb/cach-lam-com-chiem-tom-trung-bat-vi-an-la-ghien-ngay-thumb-620x620.jpg",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh minh họa",
      "michelinUrl": null,
      "searchText": "com chien tom trung mon viet",
      "importKey": "michelin:6:Cơm chiên tôm trứng",
      "restaurantId": 6,
      "chefId": 6,
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 51,
      "name": "Chả giò gan ngỗng",
      "description": "Món được nhắc đến trong hồ sơ Michelin của quán; giá từng món chưa xác nhận.",
      "price": 65000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Món Việt sáng tạo",
      "available": true,
      "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/a48e444cf62f43c9add3aa82c029e66f.jpg?format=webp&w=500&h=500",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh hồ sơ quán",
      "michelinUrl": null,
      "searchText": "cha gio gan ngong mon viet sang tao",
      "importKey": "michelin:7:Chả giò gan ngỗng",
      "restaurantId": 7,
      "chefId": 7,
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 52,
      "name": "Chả cá Hà Nội",
      "description": "Món được nhắc đến trong hồ sơ Michelin của quán; giá từng món chưa xác nhận.",
      "price": 120000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Món Việt sáng tạo",
      "available": true,
      "imagePath": "https://images.squarespace-cdn.com/content/v1/6136c5abf9b6015a86fda793/1749026130183-2EU0KH4RO7MP4RYYUTC0/IMG_4400.jpg?format=500w",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh minh họa",
      "michelinUrl": null,
      "searchText": "cha ca ha noi mon viet sang tao",
      "importKey": "michelin:7:Chả cá Hà Nội",
      "restaurantId": 7,
      "chefId": 8,
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 53,
      "name": "Bánh mì bò Wagyu",
      "description": "Món được nhắc đến trong hồ sơ Michelin của quán; giá từng món chưa xác nhận.",
      "price": 150000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Món Việt sáng tạo",
      "available": true,
      "imagePath": "https://images.food52.com/hxPFmC9mV8vuCzHkbNIRe0UJJWo%3D/d895257e-a59c-4b04-8a35-3bf3e61ece47--IMG_1045-1-v1631367547100.jpg?q=75&w=3840",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh minh họa",
      "michelinUrl": null,
      "searchText": "banh mi bo wagyu mon viet sang tao",
      "importKey": "michelin:7:Bánh mì bò Wagyu",
      "restaurantId": 7,
      "chefId": 10,
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 54,
      "name": "Ốc nhồi thịt hấp sả",
      "description": "Món được nhắc đến trong hồ sơ Michelin của quán; giá từng món chưa xác nhận.",
      "price": 120000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Món Việt",
      "available": true,
      "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/e97b984842f14438a5be9981d57876cb.jpg?format=webp&w=500&h=500",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh hồ sơ quán",
      "michelinUrl": null,
      "searchText": "oc nhoi thit hap sa mon viet",
      "importKey": "michelin:8:Ốc nhồi thịt hấp sả",
      "restaurantId": 8,
      "chefId": 8,
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 55,
      "name": "Chả cá Lã Vọng",
      "description": "Món được nhắc đến trong hồ sơ Michelin của quán; giá từng món chưa xác nhận.",
      "price": 120000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Món Việt",
      "available": true,
      "imagePath": "https://cdn.sbfoods.co.jp/recipes/08983_l.jpg",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh minh họa",
      "michelinUrl": null,
      "searchText": "cha ca la vong mon viet",
      "importKey": "michelin:8:Chả cá Lã Vọng",
      "restaurantId": 8,
      "chefId": 8,
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 56,
      "name": "Phở bò",
      "description": "Món được nhắc đến trong hồ sơ Michelin của quán; giá từng món chưa xác nhận.",
      "price": 65000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Món nước",
      "available": true,
      "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/a5740eb6c7614a07817fc6a8c13a6390.jpg?format=webp&w=500&h=500",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh hồ sơ quán",
      "michelinUrl": null,
      "searchText": "pho bo mon nuoc",
      "importKey": "michelin:9:Phở bò",
      "restaurantId": 9,
      "chefId": 5,
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 57,
      "name": "Phở thố đá",
      "description": "Món được nhắc đến trong hồ sơ Michelin của quán; giá từng món chưa xác nhận.",
      "price": 65000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Món nước",
      "available": true,
      "imagePath": "https://luhanhvietnam.com.vn/du-lich/vnt_upload/news/10_2022/quan-pho-bat-da-o-ha-noi-mai-hac-de_.jpg",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh minh họa",
      "michelinUrl": null,
      "searchText": "pho tho da mon nuoc",
      "importKey": "michelin:9:Phở thố đá",
      "restaurantId": 9,
      "chefId": 5,
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 58,
      "name": "Ốc nấu nước cốt dừa",
      "description": "Món được nhắc đến trong hồ sơ Michelin của quán; giá từng món chưa xác nhận.",
      "price": 120000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Hải sản",
      "available": true,
      "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/fc6b397fb0e44f44ba95fec351e212df.jpeg?format=webp&w=500&h=500",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh hồ sơ quán",
      "michelinUrl": null,
      "searchText": "oc nau nuoc cot dua hai san",
      "importKey": "michelin:10:Ốc nấu nước cốt dừa",
      "restaurantId": 10,
      "chefId": 8,
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 59,
      "name": "Ốc hấp tiêu xanh",
      "description": "Món được nhắc đến trong hồ sơ Michelin của quán; giá từng món chưa xác nhận.",
      "price": 120000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Hải sản",
      "available": true,
      "imagePath": "https://cdnv2.tgdd.vn/bhx-static/bhx/News/Images/2025/05/08/1577644/image8_202505080918106369.jpg",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh minh họa",
      "michelinUrl": null,
      "searchText": "oc hap tieu xanh hai san",
      "importKey": "michelin:10:Ốc hấp tiêu xanh",
      "restaurantId": 10,
      "chefId": 8,
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 60,
      "name": "Ốc hấp gừng sả",
      "description": "Món được nhắc đến trong hồ sơ Michelin của quán; giá từng món chưa xác nhận.",
      "price": 120000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Hải sản",
      "available": true,
      "imagePath": "https://file.hstatic.net/1000030244/article/cach-lam-oc-huong-hap-sa-cham-mam-gung-tuyet-ngon-khong-bi-teo-1_58dc364926544eb99961c213d6dd8916_grande.jpg",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh minh họa",
      "michelinUrl": null,
      "searchText": "oc hap gung sa hai san",
      "importKey": "michelin:10:Ốc hấp gừng sả",
      "restaurantId": 10,
      "chefId": 8,
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 61,
      "name": "Bún riêu cua",
      "description": "Món được nhắc đến trong hồ sơ Michelin của quán; giá từng món chưa xác nhận.",
      "price": 120000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Món Việt",
      "available": true,
      "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/3ca23d004c774f3a8bf32373d628886f.jpeg?format=webp&w=500&h=500",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh hồ sơ quán",
      "michelinUrl": null,
      "searchText": "bun rieu cua mon viet",
      "importKey": "michelin:11:Bún riêu cua",
      "restaurantId": 11,
      "chefId": 5,
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 62,
      "name": "Bánh tart bò kho",
      "description": "Món được nhắc đến trong hồ sơ Michelin của quán; giá từng món chưa xác nhận.",
      "price": 65000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Món Việt sáng tạo",
      "available": true,
      "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/a5b2412d51304800b573cf5b507dd2a1.jpeg?format=webp&w=500&h=500",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh hồ sơ quán",
      "michelinUrl": null,
      "searchText": "banh tart bo kho mon viet sang tao",
      "importKey": "michelin:12:Bánh tart bò kho",
      "restaurantId": 12,
      "chefId": 7,
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 63,
      "name": "Chả ốc",
      "description": "Món được nhắc đến trong hồ sơ Michelin của quán; giá từng món chưa xác nhận.",
      "price": 120000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Món Việt sáng tạo",
      "available": true,
      "imagePath": "https://khosifafood.vn/uploads/images/info/cha-oc-ket-hop-voi-rau-gi.png",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh minh họa",
      "michelinUrl": null,
      "searchText": "cha oc mon viet sang tao",
      "importKey": "michelin:12:Chả ốc",
      "restaurantId": 12,
      "chefId": 8,
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 64,
      "name": "Mochi mè đen",
      "description": "Món được nhắc đến trong hồ sơ Michelin của quán; giá từng món chưa xác nhận.",
      "price": 45000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Món Việt sáng tạo",
      "available": true,
      "imagePath": "https://rootedfare.com/cdn/shop/articles/20231023031130-untitled-3-20-2.png?v=1698030860",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh minh họa",
      "michelinUrl": null,
      "searchText": "mochi me den mon viet sang tao",
      "importKey": "michelin:12:Mochi mè đen",
      "restaurantId": 12,
      "chefId": 11,
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 65,
      "name": "Cà tím kho chuối và đậu xanh",
      "description": "Món được nhắc đến trong hồ sơ Michelin của quán; giá từng món chưa xác nhận.",
      "price": 120000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Món chay",
      "available": true,
      "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/5e579bc34b9f4c8b95718527ea67509a.jpg?format=webp&w=500&h=500",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh hồ sơ quán",
      "michelinUrl": null,
      "searchText": "ca tim kho chuoi va dau xanh mon chay",
      "importKey": "michelin:13:Cà tím kho chuối và đậu xanh",
      "restaurantId": 13,
      "chefId": 12,
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 66,
      "name": "Ốc nhồi thịt hấp sả",
      "description": "Món được nhắc đến trong hồ sơ Michelin của quán; giá từng món chưa xác nhận.",
      "price": 120000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Món Việt",
      "available": true,
      "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/82c8e41e00334475b654d1b146eb550a.jpg?format=webp&w=500&h=500",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh hồ sơ quán",
      "michelinUrl": null,
      "searchText": "oc nhoi thit hap sa mon viet",
      "importKey": "michelin:14:Ốc nhồi thịt hấp sả",
      "restaurantId": 14,
      "chefId": 8,
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 67,
      "name": "Rau chấm kho quẹt",
      "description": "Món được nhắc đến trong hồ sơ Michelin của quán; giá từng món chưa xác nhận.",
      "price": 65000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Món Việt",
      "available": true,
      "imagePath": "https://ttol.vietnamnetjsc.vn/images/2020/06/29/09/38/cach-lam-kho-quet-1.jpg",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh minh họa",
      "michelinUrl": null,
      "searchText": "rau cham kho quet mon viet",
      "importKey": "michelin:14:Rau chấm kho quẹt",
      "restaurantId": 14,
      "chefId": 9,
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 68,
      "name": "Chả giò thập cẩm",
      "description": "Món được nhắc đến trong hồ sơ Michelin của quán; giá từng món chưa xác nhận.",
      "price": 65000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Món Việt",
      "available": true,
      "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/f9493b80496d496692b175e36d8da01e.jpg?format=webp&w=500&h=500",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh hồ sơ quán",
      "michelinUrl": null,
      "searchText": "cha gio thap cam mon viet",
      "importKey": "michelin:15:Chả giò thập cẩm",
      "restaurantId": 15,
      "chefId": 7,
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 69,
      "name": "Bò lá lốt",
      "description": "Món được nhắc đến trong hồ sơ Michelin của quán; giá từng món chưa xác nhận.",
      "price": 95000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Món Việt",
      "available": true,
      "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/fc0c5adfa2ec4d22a34f90cfa4fda655.jpeg?format=webp&w=500&h=500",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh hồ sơ quán",
      "michelinUrl": null,
      "searchText": "bo la lot mon viet",
      "importKey": "michelin:16:Bò lá lốt",
      "restaurantId": 16,
      "chefId": 12,
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 70,
      "name": "Bánh hỏi thịt nướng",
      "description": "Món được nhắc đến trong hồ sơ Michelin của quán; giá từng món chưa xác nhận.",
      "price": 65000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Món Việt",
      "available": true,
      "imagePath": "https://cdn2.fptshop.com.vn/unsafe/banh_hoi_thit_nuong_2cd5400f1b.jpg",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh minh họa",
      "michelinUrl": null,
      "searchText": "banh hoi thit nuong mon viet",
      "importKey": "michelin:16:Bánh hỏi thịt nướng",
      "restaurantId": 16,
      "chefId": 7,
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 71,
      "name": "Chả giò cua",
      "description": "Món được nhắc đến trong hồ sơ Michelin của quán; giá từng món chưa xác nhận.",
      "price": 120000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Hải sản",
      "available": true,
      "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/6d8eb96bc6724eae8023545f498ec819.jpeg?format=webp&w=500&h=500",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh hồ sơ quán",
      "michelinUrl": null,
      "searchText": "cha gio cua hai san",
      "importKey": "michelin:17:Chả giò cua",
      "restaurantId": 17,
      "chefId": 7,
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 72,
      "name": "Cơm chiên cua",
      "description": "Món được nhắc đến trong hồ sơ Michelin của quán; giá từng món chưa xác nhận.",
      "price": 120000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Hải sản",
      "available": true,
      "imagePath": "https://www.monngon.tv/uploads/images/images/maxresdefault%2821%29.jpg",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh minh họa",
      "michelinUrl": null,
      "searchText": "com chien cua hai san",
      "importKey": "michelin:17:Cơm chiên cua",
      "restaurantId": 17,
      "chefId": 6,
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 73,
      "name": "Miến cua",
      "description": "Món được nhắc đến trong hồ sơ Michelin của quán; giá từng món chưa xác nhận.",
      "price": 120000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Hải sản",
      "available": true,
      "imagePath": "https://images.ckbk.com/eyJrZXkiOiJpbWFnZXMvdGhlczY0NjUzYzAyczAwMXIwMDdnMDIuanBnIiwiZWRpdHMiOnsicmVzaXplIjp7IndpdGhvdXRFbmxhcmdlbWVudCI6dHJ1ZSwid2lkdGgiOjEwMjQsImhlaWdodCI6MTAyNCwiZml0IjoiY292ZXIiLCJwb3NpdGlvbiI6ImVudHJvcHkifX19",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh minh họa",
      "michelinUrl": null,
      "searchText": "mien cua hai san",
      "importKey": "michelin:17:Miến cua",
      "restaurantId": 17,
      "chefId": 5,
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 74,
      "name": "Cuốn thịt heo tôm chua",
      "description": "Món được nhắc đến trong hồ sơ Michelin của quán; giá từng món chưa xác nhận.",
      "price": 120000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Món Việt",
      "available": true,
      "imagePath": "https://hd1.hotdeal.vn/images/uploads/2015/10/20/191941/191941-thit-cuon-tom-chua-banh-hue-nam-an-quan-body-2.jpg",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh minh họa",
      "michelinUrl": null,
      "searchText": "cuon thit heo tom chua mon viet",
      "importKey": "michelin:18:Cuốn thịt heo tôm chua",
      "restaurantId": 18,
      "chefId": 7,
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 75,
      "name": "Cá chẽm cuộn ba rọi nướng sả",
      "description": "Món được nhắc đến trong hồ sơ Michelin của quán; giá từng món chưa xác nhận.",
      "price": 120000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Món Việt",
      "available": true,
      "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/6c4c973e7e0847fcb81d160955f41384.jpeg?format=webp&w=500&h=500",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh hồ sơ quán",
      "michelinUrl": null,
      "searchText": "ca chem cuon ba roi nuong sa mon viet",
      "importKey": "michelin:18:Cá chẽm cuộn ba rọi nướng sả",
      "restaurantId": 18,
      "chefId": 7,
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 76,
      "name": "Phở gà",
      "description": "Món được nhắc đến trong hồ sơ Michelin của quán; giá từng món chưa xác nhận.",
      "price": 65000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Món nước",
      "available": true,
      "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/1812e3cd1d7e4ee2ab438af9cd5b7d6a.jpeg?format=webp&w=500&h=500",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh hồ sơ quán",
      "michelinUrl": null,
      "searchText": "pho ga mon nuoc",
      "importKey": "michelin:19:Phở gà",
      "restaurantId": 19,
      "chefId": 5,
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 77,
      "name": "Phở bò",
      "description": "Món được nhắc đến trong hồ sơ Michelin của quán; giá từng món chưa xác nhận.",
      "price": 65000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Món nước",
      "available": true,
      "imagePath": "https://gcs.tripi.vn/public-tripi/tripi-feed/img/474371zUA/quan-pho-noi-tieng-nhat-quan-hoan-kiem-210445.jpg",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh minh họa",
      "michelinUrl": null,
      "searchText": "pho bo mon nuoc",
      "importKey": "michelin:19:Phở bò",
      "restaurantId": 19,
      "chefId": 5,
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 78,
      "name": "Bánh cuốn thịt",
      "description": "Món được nhắc đến trong hồ sơ Michelin của quán; giá từng món chưa xác nhận.",
      "price": 65000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Món Việt",
      "available": true,
      "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/bbd3dbffbcdf48d4aa3c72acc1893f74.jpeg?format=webp&w=500&h=500",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh hồ sơ quán",
      "michelinUrl": null,
      "searchText": "banh cuon thit mon viet",
      "importKey": "michelin:20:Bánh cuốn thịt",
      "restaurantId": 20,
      "chefId": 7,
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 79,
      "name": "Bánh cuốn chay",
      "description": "Món được nhắc đến trong hồ sơ Michelin của quán; giá từng món chưa xác nhận.",
      "price": 65000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Món Việt",
      "available": true,
      "imagePath": "https://images.squarespace-cdn.com/content/v1/5fee116050339566e9b38f09/1647287292793-8C7NFFO1LV73Q0IG0Y27/whiskey%2Band%2Bbooch-Vietnamese-banh-cuon-vegetarian-tofu.jpg",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh minh họa",
      "michelinUrl": null,
      "searchText": "banh cuon chay mon viet",
      "importKey": "michelin:20:Bánh cuốn chay",
      "restaurantId": 20,
      "chefId": 9,
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 81,
      "name": "Bún bò thập cẩm",
      "description": "Món được nhắc đến trong hồ sơ Michelin của quán; giá từng món chưa xác nhận.",
      "price": 65000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Món nước",
      "available": true,
      "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/2298188b55ab41f9a9e9af3d9a3413c9.jpeg?format=webp&w=500&h=500",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh hồ sơ quán",
      "michelinUrl": null,
      "searchText": "bun bo thap cam mon nuoc",
      "importKey": "michelin:21:Bún bò thập cẩm",
      "restaurantId": 21,
      "chefId": 5,
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 82,
      "name": "Phở bò",
      "description": "Món được nhắc đến trong hồ sơ Michelin của quán; giá từng món chưa xác nhận.",
      "price": 65000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Ẩm thực đường phố",
      "available": true,
      "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/a577193b30fb4a9d94353dd075ee72b3.jpeg?format=webp&w=500&h=500",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh hồ sơ quán",
      "michelinUrl": null,
      "searchText": "pho bo am thuc duong pho",
      "importKey": "michelin:22:Phở bò",
      "restaurantId": 22,
      "chefId": 5,
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 83,
      "name": "Phở đuôi bò",
      "description": "Món được nhắc đến trong hồ sơ Michelin của quán; giá từng món chưa xác nhận.",
      "price": 65000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Ẩm thực đường phố",
      "available": true,
      "imagePath": "https://kenh14cdn.com/k%3Athumb_w/600/YFMU4phyIeiN1VQB5zBGRZ768aPI9/Image/2013/03/qx/IMG_0262-b03c8/sai-gon-la-mieng-voi-pho-duoi-bo-hap-dan-quan-tan-binh.JPG",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh minh họa",
      "michelinUrl": null,
      "searchText": "pho duoi bo am thuc duong pho",
      "importKey": "michelin:22:Phở đuôi bò",
      "restaurantId": 22,
      "chefId": 5,
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 84,
      "name": "Bánh xèo",
      "description": "Món được nhắc đến trong hồ sơ Michelin của quán; giá từng món chưa xác nhận.",
      "price": 65000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Món Việt",
      "available": true,
      "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/90562680ae5c47d58578cdfd31914dfc.jpeg?format=webp&w=500&h=500",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh hồ sơ quán",
      "michelinUrl": null,
      "searchText": "banh xeo mon viet",
      "importKey": "michelin:24:Bánh xèo",
      "restaurantId": 24,
      "chefId": 7,
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 85,
      "name": "Gỏi gà xé",
      "description": "Món được nhắc đến trong hồ sơ Michelin của quán; giá từng món chưa xác nhận.",
      "price": 95000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Món Việt",
      "available": true,
      "imagePath": "https://cdn2.fptshop.com.vn/unsafe/2023_12_6_638374703219254613_goi-ga-xe-phay.jpg",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh minh họa",
      "michelinUrl": null,
      "searchText": "goi ga xe mon viet",
      "importKey": "michelin:24:Gỏi gà xé",
      "restaurantId": 24,
      "chefId": 12,
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 86,
      "name": "Mì Quảng đặc biệt",
      "description": "Món được nhắc đến trong hồ sơ Michelin của quán; giá từng món chưa xác nhận.",
      "price": 65000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Món Việt",
      "available": true,
      "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/36b1ea2411da4190ac85d442b7c2e864.jpeg?format=webp&w=500&h=500",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh hồ sơ quán",
      "michelinUrl": null,
      "searchText": "mi quang dac biet mon viet",
      "importKey": "michelin:25:Mì Quảng đặc biệt",
      "restaurantId": 25,
      "chefId": 5,
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 87,
      "name": "Cơm gà xé",
      "description": "Món được nhắc đến trong hồ sơ Michelin của quán; giá từng món chưa xác nhận.",
      "price": 75000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Món Việt",
      "available": true,
      "imagePath": "https://kenh14cdn.com/2018/8/30/py3-15356163831752013966167.jpg",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh minh họa",
      "michelinUrl": null,
      "searchText": "com ga xe mon viet",
      "importKey": "michelin:25:Cơm gà xé",
      "restaurantId": 25,
      "chefId": 6,
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 88,
      "name": "Hủ tiếu Hồng Phát",
      "description": "Món được nhắc đến trong hồ sơ Michelin của quán; giá từng món chưa xác nhận.",
      "price": 65000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Món nước",
      "available": true,
      "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/1fc5fb7c414149deb301f0f85cbe1b78.jpg?format=webp&w=500&h=500",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh hồ sơ quán",
      "michelinUrl": null,
      "searchText": "hu tieu hong phat mon nuoc",
      "importKey": "michelin:26:Hủ tiếu Hồng Phát",
      "restaurantId": 26,
      "chefId": 5,
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 89,
      "name": "Chả giò tôm cua",
      "description": "Món được nhắc đến trong hồ sơ Michelin của quán; giá từng món chưa xác nhận.",
      "price": 120000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Món nước",
      "available": true,
      "imagePath": "https://product.hstatic.net/200000626331/product/cha_gio_tom_cua_bdb7ac7bc7ec4c51a170f103486f2a45_master.png",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh minh họa",
      "michelinUrl": null,
      "searchText": "cha gio tom cua mon nuoc",
      "importKey": "michelin:26:Chả giò tôm cua",
      "restaurantId": 26,
      "chefId": 7,
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 91,
      "name": "Phở bò",
      "description": "Món được nhắc đến trong hồ sơ Michelin của quán; giá từng món chưa xác nhận.",
      "price": 65000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Món nước",
      "available": true,
      "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/63c43a73ae22492c8dc5504329a8ef38.jpeg?format=webp&w=500&h=500",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh hồ sơ quán",
      "michelinUrl": null,
      "searchText": "pho bo mon nuoc",
      "importKey": "michelin:27:Phở bò",
      "restaurantId": 27,
      "chefId": 5,
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 92,
      "name": "Phở bò viên",
      "description": "Món được nhắc đến trong hồ sơ Michelin của quán; giá từng món chưa xác nhận.",
      "price": 65000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Món nước",
      "available": true,
      "imagePath": "https://storage.googleapis.com/onelife-public/blog.onelife.vn/2021/11/cach-lam-pho-bo-tai-bo-vien-mon-chinh-542451261485.jpg",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh minh họa",
      "michelinUrl": null,
      "searchText": "pho bo vien mon nuoc",
      "importKey": "michelin:27:Phở bò viên",
      "restaurantId": 27,
      "chefId": 5,
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 93,
      "name": "Bún bò Huế",
      "description": "Món được nhắc đến trong hồ sơ Michelin của quán; giá từng món chưa xác nhận.",
      "price": 65000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Ẩm thực đường phố",
      "available": true,
      "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/ca3054a1b5af4719ba458a21a7d4bf17.jpg?format=webp&w=500&h=500",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh hồ sơ quán",
      "michelinUrl": null,
      "searchText": "bun bo hue am thuc duong pho",
      "importKey": "michelin:28:Bún bò Huế",
      "restaurantId": 28,
      "chefId": 5,
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 94,
      "name": "Phở bắp hoa",
      "description": "Món được nhắc đến trong hồ sơ Michelin của quán; giá từng món chưa xác nhận.",
      "price": 65000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Món nước",
      "available": true,
      "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/dbb1d7413fdd4edcbc31d74f09c45fa3.jpeg?format=webp&w=500&h=500",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh hồ sơ quán",
      "michelinUrl": null,
      "searchText": "pho bap hoa mon nuoc",
      "importKey": "michelin:29:Phở bắp hoa",
      "restaurantId": 29,
      "chefId": 5,
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 96,
      "name": "Phở tine",
      "description": "Món được nhắc đến trong hồ sơ Michelin của quán; giá từng món chưa xác nhận.",
      "price": 65000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Món nước",
      "available": true,
      "imagePath": "https://image.vietnamnews.vn/uploadvnnews/Article/2023/9/7/299099_photine.jpg",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh minh họa",
      "michelinUrl": null,
      "searchText": "pho tine mon nuoc",
      "importKey": "michelin:29:Phở tine",
      "restaurantId": 29,
      "chefId": 5,
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 97,
      "name": "Canh gà ác tiềm",
      "description": "Món được nhắc đến trong hồ sơ Michelin của quán; giá từng món chưa xác nhận.",
      "price": 95000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Món Hoa",
      "available": true,
      "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/7ef430d105274448a65ffeab487f5068.jpeg?format=webp&w=500&h=500",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh hồ sơ quán",
      "michelinUrl": null,
      "searchText": "canh ga ac tiem mon hoa",
      "importKey": "michelin:30:Canh gà ác tiềm",
      "restaurantId": 30,
      "chefId": 12,
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 99,
      "name": "Cơm thố gà",
      "description": "Món được nhắc đến trong hồ sơ Michelin của quán; giá từng món chưa xác nhận.",
      "price": 75000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Món Hoa",
      "available": true,
      "imagePath": "https://hotel84.com/hotel84-images/news/photo/VNMNTM1P2C_com-tho-anh-nguyen-ga.jpg",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh minh họa",
      "michelinUrl": null,
      "searchText": "com tho ga mon hoa",
      "importKey": "michelin:30:Cơm thố gà",
      "restaurantId": 30,
      "chefId": 6,
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 100,
      "name": "Bún bò Huế",
      "description": "Món được nhắc đến trong hồ sơ Michelin của quán; giá từng món chưa xác nhận.",
      "price": 65000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Món Việt",
      "available": true,
      "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/28745ac2d1fa40b4a51786efd4878c47.jpeg?format=webp&w=500&h=500",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh hồ sơ quán",
      "michelinUrl": null,
      "searchText": "bun bo hue mon viet",
      "importKey": "michelin:31:Bún bò Huế",
      "restaurantId": 31,
      "chefId": 5,
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 101,
      "name": "Bánh bèo",
      "description": "Món được nhắc đến trong hồ sơ Michelin của quán; giá từng món chưa xác nhận.",
      "price": 65000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Món Việt",
      "available": true,
      "imagePath": "https://hue.gov.vn/Portals/0/Uploads/TinBai/00.00.H57/Nam2025/Thang5/70975477_2061656603934583_8777702857009790976_n_20_5_2025_15_41_43_134_CH.jpg?v=1771113600069",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh minh họa",
      "michelinUrl": null,
      "searchText": "banh beo mon viet",
      "importKey": "michelin:31:Bánh bèo",
      "restaurantId": 31,
      "chefId": 7,
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 102,
      "name": "Nem nướng",
      "description": "Món được nhắc đến trong hồ sơ Michelin của quán; giá từng món chưa xác nhận.",
      "price": 65000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Món Việt",
      "available": true,
      "imagePath": "https://tantrieutravel.com/uploads/nem-nuong-ngon-o-nha-trang.jpg?_t=1707797215",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh minh họa",
      "michelinUrl": null,
      "searchText": "nem nuong mon viet",
      "importKey": "michelin:31:Nem nướng",
      "restaurantId": 31,
      "chefId": 7,
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 103,
      "name": "Phở tái lăn",
      "description": "Món được nhắc đến trong hồ sơ Michelin của quán; giá từng món chưa xác nhận.",
      "price": 65000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Món nước",
      "available": true,
      "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/69eff81a25924e62820a6dfcbe597a4b.jpeg?format=webp&w=500&h=500",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh hồ sơ quán",
      "michelinUrl": null,
      "searchText": "pho tai lan mon nuoc",
      "importKey": "michelin:33:Phở tái lăn",
      "restaurantId": 33,
      "chefId": 5,
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 105,
      "name": "Bún thịt nướng",
      "description": "Món được nhắc đến trong hồ sơ Michelin của quán; giá từng món chưa xác nhận.",
      "price": 65000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Món nước",
      "available": true,
      "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/477a90e43a9943c9b7d616340eae9bdc.jpeg?format=webp&w=500&h=500",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh hồ sơ quán",
      "michelinUrl": null,
      "searchText": "bun thit nuong mon nuoc",
      "importKey": "michelin:34:Bún thịt nướng",
      "restaurantId": 34,
      "chefId": 5,
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 106,
      "name": "Ốc xào bơ tỏi",
      "description": "Món được nhắc đến trong hồ sơ Michelin của quán; giá từng món chưa xác nhận.",
      "price": 120000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Hải sản",
      "available": true,
      "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/193f923462704373808cab898b4448ca.jpeg?format=webp&w=500&h=500",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh hồ sơ quán",
      "michelinUrl": null,
      "searchText": "oc xao bo toi hai san",
      "importKey": "michelin:36:Ốc xào bơ tỏi",
      "restaurantId": 36,
      "chefId": 8,
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 107,
      "name": "Ốc nướng muối",
      "description": "Món được nhắc đến trong hồ sơ Michelin của quán; giá từng món chưa xác nhận.",
      "price": 120000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Hải sản",
      "available": true,
      "imagePath": "https://thanhnien.mediacdn.vn/Uploaded/minhnguyet/2022_09_12/huong-vi-5772.jpg",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh minh họa",
      "michelinUrl": null,
      "searchText": "oc nuong muoi hai san",
      "importKey": "michelin:36:Ốc nướng muối",
      "restaurantId": 36,
      "chefId": 8,
      "createdAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "id": 176,
      "name": "Pizza phô mai sốt cà chua",
      "description": "Pizza nướng với lớp phô mai và sốt cà chua, phù hợp dùng chung. Tên, công thức và giá do người tạo dữ liệu đặt cho bài tập, không phải thông tin xác nhận từ nguồn ảnh hoặc nhà hàng.",
      "price": 150000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Pizza",
      "available": true,
      "imagePath": "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=2370&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh minh họa",
      "michelinUrl": null,
      "searchText": "pizza pho mai sot ca chua pizza",
      "importKey": "user-unsplash:pizza:photo-1513104890138-7c749659a591",
      "restaurantId": 37,
      "chefId": 10,
      "createdAt": "2026-10-12T17:11:20.049Z"
    },
    {
      "id": 177,
      "name": "Salad rau xanh cà chua",
      "description": "Salad rau xanh và cà chua, lựa chọn nhẹ nhàng cho phần khai vị. Tên, công thức và giá do người tạo dữ liệu đặt cho bài tập, không phải thông tin xác nhận từ nguồn ảnh hoặc nhà hàng.",
      "price": 65000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Salad",
      "available": true,
      "imagePath": "https://images.unsplash.com/photo-1607532941433-304659e8198a?q=80&w=2156&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh minh họa",
      "michelinUrl": null,
      "searchText": "salad rau xanh ca chua salad",
      "importKey": "user-image:photo-1607532941433-304659e8198a",
      "restaurantId": 37,
      "chefId": 9,
      "createdAt": "2026-10-12T17:11:20.266Z"
    },
    {
      "id": 178,
      "name": "Salad bowl rau củ",
      "description": "Tô salad nhiều màu sắc, kết hợp rau củ và topping minh họa. Tên, công thức và giá do người tạo dữ liệu đặt cho bài tập, không phải thông tin xác nhận từ nguồn ảnh hoặc nhà hàng.",
      "price": 85000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Salad",
      "available": true,
      "imagePath": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1760&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh minh họa",
      "michelinUrl": null,
      "searchText": "salad bowl rau cu salad",
      "importKey": "user-image:photo-1546069901-ba9599a7e63c",
      "restaurantId": 37,
      "chefId": 9,
      "createdAt": "2026-10-12T17:11:20.440Z"
    },
    {
      "id": 179,
      "name": "Salad bowl tổng hợp",
      "description": "Tô salad tổng hợp với rau xanh và các loại topping. Tên, công thức và giá do người tạo dữ liệu đặt cho bài tập, không phải thông tin xác nhận từ nguồn ảnh hoặc nhà hàng.",
      "price": 90000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Salad",
      "available": true,
      "imagePath": "https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?q=80&w=1364&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh minh họa",
      "michelinUrl": null,
      "searchText": "salad bowl tong hop salad",
      "importKey": "user-image:photo-1623428187969-5da2dcea5ebf",
      "restaurantId": 37,
      "chefId": 9,
      "createdAt": "2026-10-12T17:11:20.603Z"
    },
    {
      "id": 180,
      "name": "Burger bò phô mai",
      "description": "Burger kẹp thịt, phô mai và rau xanh; khẩu phần và công thức là demo. Tên, công thức và giá do người tạo dữ liệu đặt cho bài tập, không phải thông tin xác nhận từ nguồn ảnh hoặc nhà hàng.",
      "price": 95000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Burger",
      "available": true,
      "imagePath": "https://images.unsplash.com/photo-1610440042657-612c34d95e9f?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh minh họa",
      "michelinUrl": null,
      "searchText": "burger bo pho mai burger",
      "importKey": "user-image:photo-1610440042657-612c34d95e9f",
      "restaurantId": 37,
      "chefId": 10,
      "createdAt": "2026-10-12T17:11:20.806Z"
    },
    {
      "id": 181,
      "name": "Khoai tây chiên sốt kem",
      "description": "Khoai tây chiên dùng cùng sốt kem và topping minh họa. Tên, công thức và giá do người tạo dữ liệu đặt cho bài tập, không phải thông tin xác nhận từ nguồn ảnh hoặc nhà hàng.",
      "price": 55000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Ăn nhẹ",
      "available": true,
      "imagePath": "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh minh họa",
      "michelinUrl": null,
      "searchText": "khoai tay chien sot kem an nhe",
      "importKey": "user-image:photo-1573080496219-bb080dd4f877",
      "restaurantId": 37,
      "chefId": 11,
      "createdAt": "2026-10-12T17:11:20.979Z"
    },
    {
      "id": 182,
      "name": "Khoai tây chiên giòn",
      "description": "Khoai tây chiên vàng giòn, dùng cùng sốt cà chua. Tên, công thức và giá do người tạo dữ liệu đặt cho bài tập, không phải thông tin xác nhận từ nguồn ảnh hoặc nhà hàng.",
      "price": 45000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Ăn nhẹ",
      "available": true,
      "imagePath": "https://images.unsplash.com/photo-1608219994488-cc269412b3e4?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh minh họa",
      "michelinUrl": null,
      "searchText": "khoai tay chien gion an nhe",
      "importKey": "user-image:photo-1608219994488-cc269412b3e4",
      "restaurantId": 37,
      "chefId": 10,
      "createdAt": "2026-10-12T17:11:21.176Z"
    },
    {
      "id": 183,
      "name": "Gà rán và khoai tây",
      "description": "Phần gà rán và khoai tây chiên minh họa cho thực đơn. Tên, công thức và giá do người tạo dữ liệu đặt cho bài tập, không phải thông tin xác nhận từ nguồn ảnh hoặc nhà hàng.",
      "price": 120000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Món chính",
      "available": true,
      "imagePath": "https://plus.unsplash.com/premium_photo-1683139918895-06f8f3b9939e?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh minh họa",
      "michelinUrl": null,
      "searchText": "ga ran va khoai tay mon chinh",
      "importKey": "user-image:premium_photo-1683139918895-06f8f3b9939e",
      "restaurantId": 37,
      "chefId": 10,
      "createdAt": "2026-10-12T17:11:21.338Z"
    },
    {
      "id": 184,
      "name": "Mì Ý penne sốt cà chua",
      "description": "Mì penne dùng cùng sốt cà chua và rau thơm. Tên, công thức và giá do người tạo dữ liệu đặt cho bài tập, không phải thông tin xác nhận từ nguồn ảnh hoặc nhà hàng.",
      "price": 110000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Mì Ý",
      "available": true,
      "imagePath": "https://plus.unsplash.com/premium_photo-1664478288635-b9703a502393?q=80&w=1760&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh minh họa",
      "michelinUrl": null,
      "searchText": "mi y penne sot ca chua mi y",
      "importKey": "user-image:premium_photo-1664478288635-b9703a502393",
      "restaurantId": 37,
      "chefId": 10,
      "createdAt": "2026-10-12T17:11:21.521Z"
    },
    {
      "id": 185,
      "name": "Pizza pepperoni",
      "description": "Pizza với topping pepperoni và phô mai; thông tin món là demo. Tên, công thức và giá do người tạo dữ liệu đặt cho bài tập, không phải thông tin xác nhận từ nguồn ảnh hoặc nhà hàng.",
      "price": 165000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Pizza",
      "available": true,
      "imagePath": "https://images.unsplash.com/photo-1628840042765-356cda07504e?q=80&w=1760&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh minh họa",
      "michelinUrl": null,
      "searchText": "pizza pepperoni pizza",
      "importKey": "user-image:photo-1628840042765-356cda07504e",
      "restaurantId": 37,
      "chefId": 10,
      "createdAt": "2026-10-12T17:11:21.703Z"
    },
    {
      "id": 186,
      "name": "Sandwich rau củ",
      "description": "Sandwich kẹp rau củ, gợi ý cho một bữa ăn nhẹ. Tên, công thức và giá do người tạo dữ liệu đặt cho bài tập, không phải thông tin xác nhận từ nguồn ảnh hoặc nhà hàng.",
      "price": 70000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Bánh mì",
      "available": true,
      "imagePath": "https://plus.unsplash.com/premium_photo-1740517280275-921d4de63081?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh minh họa",
      "michelinUrl": null,
      "searchText": "sandwich rau cu banh mi",
      "importKey": "user-image:premium_photo-1740517280275-921d4de63081",
      "restaurantId": 37,
      "chefId": 10,
      "createdAt": "2026-10-12T17:11:21.867Z"
    },
    {
      "id": 187,
      "name": "Bánh mì kẹp",
      "description": "Bánh mì với phần nhân và rau thơm minh họa. Tên, công thức và giá do người tạo dữ liệu đặt cho bài tập, không phải thông tin xác nhận từ nguồn ảnh hoặc nhà hàng.",
      "price": 45000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Bánh mì",
      "available": true,
      "imagePath": "https://images.unsplash.com/photo-1715925717150-2a6d181d8846?q=80&w=1286&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh minh họa",
      "michelinUrl": null,
      "searchText": "banh mi kep banh mi",
      "importKey": "user-image:photo-1715925717150-2a6d181d8846",
      "restaurantId": 37,
      "chefId": 7,
      "createdAt": "2026-10-12T17:11:22.038Z"
    },
    {
      "id": 188,
      "name": "Gỏi cuốn",
      "description": "Gỏi cuốn dùng kèm nước chấm, món khai vị nhẹ nhàng. Tên, công thức và giá do người tạo dữ liệu đặt cho bài tập, không phải thông tin xác nhận từ nguồn ảnh hoặc nhà hàng.",
      "price": 60000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Khai vị",
      "available": true,
      "imagePath": "https://images.unsplash.com/photo-1594020292985-216a72a2c7ce?q=80&w=2681&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh minh họa",
      "michelinUrl": null,
      "searchText": "goi cuon khai vi",
      "importKey": "user-image:photo-1594020292985-216a72a2c7ce",
      "restaurantId": 37,
      "chefId": 7,
      "createdAt": "2026-10-12T17:11:22.205Z"
    },
    {
      "id": 189,
      "name": "Bún thịt và rau thơm",
      "description": "Tô bún với thịt, rau thơm và rau củ; công thức cụ thể là demo. Tên, công thức và giá do người tạo dữ liệu đặt cho bài tập, không phải thông tin xác nhận từ nguồn ảnh hoặc nhà hàng.",
      "price": 85000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Món chính",
      "available": true,
      "imagePath": "https://images.unsplash.com/photo-1597345637412-9fd611e758f3?q=80&w=2370&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh minh họa",
      "michelinUrl": null,
      "searchText": "bun thit va rau thom mon chinh",
      "importKey": "user-image:photo-1597345637412-9fd611e758f3",
      "restaurantId": 37,
      "chefId": 5,
      "createdAt": "2026-10-12T17:11:22.366Z"
    },
    {
      "id": 190,
      "name": "Đồ uống trái cây tổng hợp",
      "description": "Đồ uống trái cây nhiều màu sắc, phục vụ theo ly minh họa. Tên, công thức và giá do người tạo dữ liệu đặt cho bài tập, không phải thông tin xác nhận từ nguồn ảnh hoặc nhà hàng.",
      "price": 45000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Đồ uống",
      "available": true,
      "imagePath": "https://images.unsplash.com/photo-1782849206170-dba15f39acb7?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh minh họa",
      "michelinUrl": null,
      "searchText": "do uong trai cay tong hop do uong",
      "importKey": "user-image:photo-1782849206170-dba15f39acb7",
      "restaurantId": 39,
      "chefId": 11,
      "createdAt": "2026-10-12T17:11:22.530Z"
    },
    {
      "id": 191,
      "name": "Đồ uống chanh và trái cây",
      "description": "Đồ uống giải khát với chanh và trái cây, nội dung là demo. Tên, công thức và giá do người tạo dữ liệu đặt cho bài tập, không phải thông tin xác nhận từ nguồn ảnh hoặc nhà hàng.",
      "price": 45000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Đồ uống",
      "available": true,
      "imagePath": "https://images.unsplash.com/photo-1782849205997-335c93fdc6c8?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh minh họa",
      "michelinUrl": null,
      "searchText": "do uong chanh va trai cay do uong",
      "importKey": "user-image:photo-1782849205997-335c93fdc6c8",
      "restaurantId": 39,
      "chefId": 11,
      "createdAt": "2026-10-12T17:11:22.707Z"
    },
    {
      "id": 192,
      "name": "Bia tươi",
      "description": "Một ly bia tươi minh họa; thương hiệu và dung tích chưa được xác định. Tên, công thức và giá do người tạo dữ liệu đặt cho bài tập, không phải thông tin xác nhận từ nguồn ảnh hoặc nhà hàng.",
      "price": 45000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Đồ uống",
      "available": true,
      "imagePath": "https://images.unsplash.com/photo-1608270586620-248524c67de9?q=80&w=2370&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh minh họa",
      "michelinUrl": null,
      "searchText": "bia tuoi do uong",
      "importKey": "user-image:photo-1608270586620-248524c67de9",
      "restaurantId": 39,
      "chefId": 11,
      "createdAt": "2026-10-12T17:11:22.874Z"
    },
    {
      "id": 193,
      "name": "Cá hồi áp chảo",
      "description": "Phần cá hồi dùng cùng rau củ và sốt minh họa. Tên, công thức và giá do người tạo dữ liệu đặt cho bài tập, không phải thông tin xác nhận từ nguồn ảnh hoặc nhà hàng.",
      "price": 185000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Hải sản",
      "available": true,
      "imagePath": "https://images.unsplash.com/photo-1467003909585-2f8a72700288?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh minh họa",
      "michelinUrl": null,
      "searchText": "ca hoi ap chao hai san",
      "importKey": "user-image:photo-1467003909585-2f8a72700288",
      "restaurantId": 38,
      "chefId": 8,
      "createdAt": "2026-10-12T17:11:23.038Z"
    },
    {
      "id": 194,
      "name": "Tôm và rau củ",
      "description": "Tôm dùng cùng rau củ và chanh, gợi ý cho món chính. Tên, công thức và giá do người tạo dữ liệu đặt cho bài tập, không phải thông tin xác nhận từ nguồn ảnh hoặc nhà hàng.",
      "price": 160000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Hải sản",
      "available": true,
      "imagePath": "https://plus.unsplash.com/premium_photo-1707935175109-ba307d98bfe2?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh minh họa",
      "michelinUrl": null,
      "searchText": "tom va rau cu hai san",
      "importKey": "user-image:premium_photo-1707935175109-ba307d98bfe2",
      "restaurantId": 38,
      "chefId": 8,
      "createdAt": "2026-10-12T17:11:23.212Z"
    },
    {
      "id": 195,
      "name": "Hàu với topping",
      "description": "Phần hàu trên đá với các loại topping; cách chế biến cụ thể là demo. Tên, công thức và giá do người tạo dữ liệu đặt cho bài tập, không phải thông tin xác nhận từ nguồn ảnh hoặc nhà hàng.",
      "price": 180000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Hải sản",
      "available": true,
      "imagePath": "https://media.istockphoto.com/id/2261269195/photo/fresh-oyster-platter-on-ice-with-tobiko-crispy-garlic-and-asian-toppings.webp?a=1&b=1&s=612x612&w=0&k=20&c=LAyrzKWSRyAFP5CNhdjEXVss4I61NTP2v0Vzmi3Yuyw=",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh minh họa",
      "michelinUrl": null,
      "searchText": "hau voi topping hai san",
      "importKey": "user-image:id",
      "restaurantId": 38,
      "chefId": 8,
      "createdAt": "2026-10-12T17:11:23.371Z"
    },
    {
      "id": 196,
      "name": "Hải sản nướng tổng hợp",
      "description": "Đĩa hải sản nướng tổng hợp, phù hợp dùng chung. Tên, công thức và giá do người tạo dữ liệu đặt cho bài tập, không phải thông tin xác nhận từ nguồn ảnh hoặc nhà hàng.",
      "price": 220000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Hải sản",
      "available": true,
      "imagePath": "https://images.unsplash.com/photo-1622549071350-226435092804?q=80&w=1332&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh minh họa",
      "michelinUrl": null,
      "searchText": "hai san nuong tong hop hai san",
      "importKey": "user-image:photo-1622549071350-226435092804",
      "restaurantId": 38,
      "chefId": 8,
      "createdAt": "2026-10-12T17:11:23.539Z"
    },
    {
      "id": 197,
      "name": "Nghêu hấp chanh",
      "description": "Nghêu dùng cùng chanh và rau thơm; công thức là demo. Tên, công thức và giá do người tạo dữ liệu đặt cho bài tập, không phải thông tin xác nhận từ nguồn ảnh hoặc nhà hàng.",
      "price": 95000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Hải sản",
      "available": true,
      "imagePath": "https://images.unsplash.com/photo-1448043552756-e747b7a2b2b8?q=80&w=2104&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh minh họa",
      "michelinUrl": null,
      "searchText": "ngheu hap chanh hai san",
      "importKey": "user-image:photo-1448043552756-e747b7a2b2b8",
      "restaurantId": 38,
      "chefId": 8,
      "createdAt": "2026-10-12T17:11:23.696Z"
    },
    {
      "id": 198,
      "name": "Hải sản trong vỏ sò",
      "description": "Phần hải sản trình bày trong vỏ sò, dùng làm món khai vị minh họa. Tên, công thức và giá do người tạo dữ liệu đặt cho bài tập, không phải thông tin xác nhận từ nguồn ảnh hoặc nhà hàng.",
      "price": 150000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Hải sản",
      "available": true,
      "imagePath": "https://images.unsplash.com/photo-1713620305225-aab6b77317e7?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh minh họa",
      "michelinUrl": null,
      "searchText": "hai san trong vo so hai san",
      "importKey": "user-image:photo-1713620305225-aab6b77317e7",
      "restaurantId": 38,
      "chefId": 8,
      "createdAt": "2026-10-12T17:11:23.850Z"
    },
    {
      "id": 199,
      "name": "Sò điệp áp chảo",
      "description": "Sò điệp áp chảo trình bày cùng rau củ và sốt minh họa. Tên, công thức và giá do người tạo dữ liệu đặt cho bài tập, không phải thông tin xác nhận từ nguồn ảnh hoặc nhà hàng.",
      "price": 190000,
      "priceIsDemo": true,
      "recipeIsDemo": true,
      "category": "Hải sản",
      "available": true,
      "imagePath": "https://images.unsplash.com/photo-1605759758891-430e7885631b?q=80&w=1287&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D",
      "priceSymbol": "VND",
      "priceLabel": "Giá demo",
      "priceMinVnd": null,
      "priceMaxVnd": null,
      "photoType": "Ảnh minh họa",
      "michelinUrl": null,
      "searchText": "so diep ap chao hai san",
      "importKey": "user-image:photo-1605759758891-430e7885631b",
      "restaurantId": 38,
      "chefId": 8,
      "createdAt": "2026-10-12T17:11:24.013Z"
    }
  ],
  "dishIngredient": [
    {
      "dishId": 40,
      "ingredientId": 2
    },
    {
      "dishId": 40,
      "ingredientId": 4
    },
    {
      "dishId": 40,
      "ingredientId": 7
    },
    {
      "dishId": 41,
      "ingredientId": 6
    },
    {
      "dishId": 41,
      "ingredientId": 7
    },
    {
      "dishId": 41,
      "ingredientId": 24
    },
    {
      "dishId": 42,
      "ingredientId": 5
    },
    {
      "dishId": 42,
      "ingredientId": 7
    },
    {
      "dishId": 42,
      "ingredientId": 38
    },
    {
      "dishId": 43,
      "ingredientId": 7
    },
    {
      "dishId": 43,
      "ingredientId": 30
    },
    {
      "dishId": 43,
      "ingredientId": 38
    },
    {
      "dishId": 44,
      "ingredientId": 7
    },
    {
      "dishId": 44,
      "ingredientId": 12
    },
    {
      "dishId": 44,
      "ingredientId": 13
    },
    {
      "dishId": 44,
      "ingredientId": 31
    },
    {
      "dishId": 45,
      "ingredientId": 4
    },
    {
      "dishId": 45,
      "ingredientId": 7
    },
    {
      "dishId": 45,
      "ingredientId": 36
    },
    {
      "dishId": 45,
      "ingredientId": 37
    },
    {
      "dishId": 46,
      "ingredientId": 7
    },
    {
      "dishId": 47,
      "ingredientId": 5
    },
    {
      "dishId": 47,
      "ingredientId": 7
    },
    {
      "dishId": 48,
      "ingredientId": 28
    },
    {
      "dishId": 48,
      "ingredientId": 32
    },
    {
      "dishId": 49,
      "ingredientId": 7
    },
    {
      "dishId": 49,
      "ingredientId": 12
    },
    {
      "dishId": 49,
      "ingredientId": 37
    },
    {
      "dishId": 50,
      "ingredientId": 7
    },
    {
      "dishId": 50,
      "ingredientId": 11
    },
    {
      "dishId": 50,
      "ingredientId": 12
    },
    {
      "dishId": 50,
      "ingredientId": 27
    },
    {
      "dishId": 51,
      "ingredientId": 7
    },
    {
      "dishId": 51,
      "ingredientId": 9
    },
    {
      "dishId": 51,
      "ingredientId": 37
    },
    {
      "dishId": 51,
      "ingredientId": 42
    },
    {
      "dishId": 52,
      "ingredientId": 7
    },
    {
      "dishId": 52,
      "ingredientId": 15
    },
    {
      "dishId": 53,
      "ingredientId": 4
    },
    {
      "dishId": 53,
      "ingredientId": 7
    },
    {
      "dishId": 53,
      "ingredientId": 24
    },
    {
      "dishId": 53,
      "ingredientId": 26
    },
    {
      "dishId": 54,
      "ingredientId": 7
    },
    {
      "dishId": 54,
      "ingredientId": 8
    },
    {
      "dishId": 54,
      "ingredientId": 14
    },
    {
      "dishId": 55,
      "ingredientId": 7
    },
    {
      "dishId": 55,
      "ingredientId": 15
    },
    {
      "dishId": 56,
      "ingredientId": 2
    },
    {
      "dishId": 56,
      "ingredientId": 4
    },
    {
      "dishId": 56,
      "ingredientId": 7
    },
    {
      "dishId": 57,
      "ingredientId": 2
    },
    {
      "dishId": 57,
      "ingredientId": 7
    },
    {
      "dishId": 58,
      "ingredientId": 7
    },
    {
      "dishId": 58,
      "ingredientId": 14
    },
    {
      "dishId": 58,
      "ingredientId": 41
    },
    {
      "dishId": 59,
      "ingredientId": 7
    },
    {
      "dishId": 59,
      "ingredientId": 14
    },
    {
      "dishId": 59,
      "ingredientId": 39
    },
    {
      "dishId": 60,
      "ingredientId": 7
    },
    {
      "dishId": 60,
      "ingredientId": 8
    },
    {
      "dishId": 60,
      "ingredientId": 14
    },
    {
      "dishId": 60,
      "ingredientId": 40
    },
    {
      "dishId": 61,
      "ingredientId": 3
    },
    {
      "dishId": 61,
      "ingredientId": 7
    },
    {
      "dishId": 61,
      "ingredientId": 13
    },
    {
      "dishId": 62,
      "ingredientId": 4
    },
    {
      "dishId": 62,
      "ingredientId": 7
    },
    {
      "dishId": 62,
      "ingredientId": 24
    },
    {
      "dishId": 63,
      "ingredientId": 7
    },
    {
      "dishId": 63,
      "ingredientId": 14
    },
    {
      "dishId": 64,
      "ingredientId": 29
    },
    {
      "dishId": 64,
      "ingredientId": 32
    },
    {
      "dishId": 64,
      "ingredientId": 38
    },
    {
      "dishId": 65,
      "ingredientId": 7
    },
    {
      "dishId": 66,
      "ingredientId": 7
    },
    {
      "dishId": 66,
      "ingredientId": 8
    },
    {
      "dishId": 66,
      "ingredientId": 14
    },
    {
      "dishId": 67,
      "ingredientId": 7
    },
    {
      "dishId": 67,
      "ingredientId": 20
    },
    {
      "dishId": 68,
      "ingredientId": 7
    },
    {
      "dishId": 68,
      "ingredientId": 9
    },
    {
      "dishId": 68,
      "ingredientId": 37
    },
    {
      "dishId": 69,
      "ingredientId": 4
    },
    {
      "dishId": 69,
      "ingredientId": 7
    },
    {
      "dishId": 69,
      "ingredientId": 36
    },
    {
      "dishId": 70,
      "ingredientId": 6
    },
    {
      "dishId": 70,
      "ingredientId": 7
    },
    {
      "dishId": 70,
      "ingredientId": 37
    },
    {
      "dishId": 71,
      "ingredientId": 7
    },
    {
      "dishId": 71,
      "ingredientId": 9
    },
    {
      "dishId": 71,
      "ingredientId": 13
    },
    {
      "dishId": 71,
      "ingredientId": 37
    },
    {
      "dishId": 72,
      "ingredientId": 7
    },
    {
      "dishId": 72,
      "ingredientId": 11
    },
    {
      "dishId": 72,
      "ingredientId": 13
    },
    {
      "dishId": 73,
      "ingredientId": 7
    },
    {
      "dishId": 73,
      "ingredientId": 13
    },
    {
      "dishId": 73,
      "ingredientId": 35
    },
    {
      "dishId": 74,
      "ingredientId": 6
    },
    {
      "dishId": 74,
      "ingredientId": 7
    },
    {
      "dishId": 74,
      "ingredientId": 9
    },
    {
      "dishId": 74,
      "ingredientId": 12
    },
    {
      "dishId": 74,
      "ingredientId": 37
    },
    {
      "dishId": 75,
      "ingredientId": 7
    },
    {
      "dishId": 75,
      "ingredientId": 8
    },
    {
      "dishId": 75,
      "ingredientId": 9
    },
    {
      "dishId": 75,
      "ingredientId": 15
    },
    {
      "dishId": 75,
      "ingredientId": 37
    },
    {
      "dishId": 76,
      "ingredientId": 2
    },
    {
      "dishId": 76,
      "ingredientId": 5
    },
    {
      "dishId": 76,
      "ingredientId": 7
    },
    {
      "dishId": 77,
      "ingredientId": 2
    },
    {
      "dishId": 77,
      "ingredientId": 4
    },
    {
      "dishId": 77,
      "ingredientId": 7
    },
    {
      "dishId": 78,
      "ingredientId": 7
    },
    {
      "dishId": 78,
      "ingredientId": 9
    },
    {
      "dishId": 78,
      "ingredientId": 37
    },
    {
      "dishId": 79,
      "ingredientId": 7
    },
    {
      "dishId": 79,
      "ingredientId": 9
    },
    {
      "dishId": 79,
      "ingredientId": 20
    },
    {
      "dishId": 79,
      "ingredientId": 28
    },
    {
      "dishId": 79,
      "ingredientId": 37
    },
    {
      "dishId": 81,
      "ingredientId": 3
    },
    {
      "dishId": 81,
      "ingredientId": 4
    },
    {
      "dishId": 81,
      "ingredientId": 7
    },
    {
      "dishId": 82,
      "ingredientId": 2
    },
    {
      "dishId": 82,
      "ingredientId": 4
    },
    {
      "dishId": 82,
      "ingredientId": 7
    },
    {
      "dishId": 83,
      "ingredientId": 2
    },
    {
      "dishId": 83,
      "ingredientId": 4
    },
    {
      "dishId": 83,
      "ingredientId": 7
    },
    {
      "dishId": 84,
      "ingredientId": 7
    },
    {
      "dishId": 84,
      "ingredientId": 37
    },
    {
      "dishId": 85,
      "ingredientId": 5
    },
    {
      "dishId": 85,
      "ingredientId": 7
    },
    {
      "dishId": 86,
      "ingredientId": 7
    },
    {
      "dishId": 86,
      "ingredientId": 37
    },
    {
      "dishId": 87,
      "ingredientId": 5
    },
    {
      "dishId": 87,
      "ingredientId": 7
    },
    {
      "dishId": 87,
      "ingredientId": 11
    },
    {
      "dishId": 88,
      "ingredientId": 7
    },
    {
      "dishId": 88,
      "ingredientId": 37
    },
    {
      "dishId": 89,
      "ingredientId": 7
    },
    {
      "dishId": 89,
      "ingredientId": 9
    },
    {
      "dishId": 89,
      "ingredientId": 12
    },
    {
      "dishId": 89,
      "ingredientId": 13
    },
    {
      "dishId": 89,
      "ingredientId": 37
    },
    {
      "dishId": 91,
      "ingredientId": 2
    },
    {
      "dishId": 91,
      "ingredientId": 4
    },
    {
      "dishId": 91,
      "ingredientId": 7
    },
    {
      "dishId": 92,
      "ingredientId": 2
    },
    {
      "dishId": 92,
      "ingredientId": 4
    },
    {
      "dishId": 92,
      "ingredientId": 7
    },
    {
      "dishId": 93,
      "ingredientId": 3
    },
    {
      "dishId": 93,
      "ingredientId": 4
    },
    {
      "dishId": 93,
      "ingredientId": 7
    },
    {
      "dishId": 94,
      "ingredientId": 2
    },
    {
      "dishId": 94,
      "ingredientId": 7
    },
    {
      "dishId": 94,
      "ingredientId": 30
    },
    {
      "dishId": 96,
      "ingredientId": 2
    },
    {
      "dishId": 96,
      "ingredientId": 7
    },
    {
      "dishId": 97,
      "ingredientId": 5
    },
    {
      "dishId": 97,
      "ingredientId": 7
    },
    {
      "dishId": 99,
      "ingredientId": 5
    },
    {
      "dishId": 99,
      "ingredientId": 7
    },
    {
      "dishId": 99,
      "ingredientId": 11
    },
    {
      "dishId": 100,
      "ingredientId": 3
    },
    {
      "dishId": 100,
      "ingredientId": 4
    },
    {
      "dishId": 100,
      "ingredientId": 7
    },
    {
      "dishId": 101,
      "ingredientId": 7
    },
    {
      "dishId": 101,
      "ingredientId": 37
    },
    {
      "dishId": 102,
      "ingredientId": 6
    },
    {
      "dishId": 102,
      "ingredientId": 7
    },
    {
      "dishId": 102,
      "ingredientId": 37
    },
    {
      "dishId": 103,
      "ingredientId": 2
    },
    {
      "dishId": 103,
      "ingredientId": 7
    },
    {
      "dishId": 105,
      "ingredientId": 3
    },
    {
      "dishId": 105,
      "ingredientId": 6
    },
    {
      "dishId": 105,
      "ingredientId": 7
    },
    {
      "dishId": 106,
      "ingredientId": 4
    },
    {
      "dishId": 106,
      "ingredientId": 7
    },
    {
      "dishId": 106,
      "ingredientId": 14
    },
    {
      "dishId": 107,
      "ingredientId": 7
    },
    {
      "dishId": 107,
      "ingredientId": 14
    },
    {
      "dishId": 176,
      "ingredientId": 7
    },
    {
      "dishId": 176,
      "ingredientId": 21
    },
    {
      "dishId": 176,
      "ingredientId": 23
    },
    {
      "dishId": 176,
      "ingredientId": 24
    },
    {
      "dishId": 177,
      "ingredientId": 7
    },
    {
      "dishId": 177,
      "ingredientId": 20
    },
    {
      "dishId": 177,
      "ingredientId": 21
    },
    {
      "dishId": 178,
      "ingredientId": 7
    },
    {
      "dishId": 178,
      "ingredientId": 20
    },
    {
      "dishId": 179,
      "ingredientId": 7
    },
    {
      "dishId": 179,
      "ingredientId": 20
    },
    {
      "dishId": 180,
      "ingredientId": 4
    },
    {
      "dishId": 180,
      "ingredientId": 7
    },
    {
      "dishId": 180,
      "ingredientId": 23
    },
    {
      "dishId": 180,
      "ingredientId": 24
    },
    {
      "dishId": 181,
      "ingredientId": 22
    },
    {
      "dishId": 181,
      "ingredientId": 24
    },
    {
      "dishId": 181,
      "ingredientId": 32
    },
    {
      "dishId": 181,
      "ingredientId": 43
    },
    {
      "dishId": 182,
      "ingredientId": 7
    },
    {
      "dishId": 182,
      "ingredientId": 22
    },
    {
      "dishId": 182,
      "ingredientId": 24
    },
    {
      "dishId": 183,
      "ingredientId": 5
    },
    {
      "dishId": 183,
      "ingredientId": 7
    },
    {
      "dishId": 183,
      "ingredientId": 22
    },
    {
      "dishId": 183,
      "ingredientId": 24
    },
    {
      "dishId": 184,
      "ingredientId": 7
    },
    {
      "dishId": 184,
      "ingredientId": 21
    },
    {
      "dishId": 184,
      "ingredientId": 24
    },
    {
      "dishId": 184,
      "ingredientId": 25
    },
    {
      "dishId": 185,
      "ingredientId": 7
    },
    {
      "dishId": 185,
      "ingredientId": 23
    },
    {
      "dishId": 185,
      "ingredientId": 24
    },
    {
      "dishId": 186,
      "ingredientId": 7
    },
    {
      "dishId": 186,
      "ingredientId": 20
    },
    {
      "dishId": 186,
      "ingredientId": 24
    },
    {
      "dishId": 187,
      "ingredientId": 7
    },
    {
      "dishId": 187,
      "ingredientId": 26
    },
    {
      "dishId": 188,
      "ingredientId": 7
    },
    {
      "dishId": 188,
      "ingredientId": 9
    },
    {
      "dishId": 188,
      "ingredientId": 37
    },
    {
      "dishId": 189,
      "ingredientId": 3
    },
    {
      "dishId": 189,
      "ingredientId": 7
    },
    {
      "dishId": 189,
      "ingredientId": 20
    },
    {
      "dishId": 190,
      "ingredientId": 32
    },
    {
      "dishId": 190,
      "ingredientId": 34
    },
    {
      "dishId": 191,
      "ingredientId": 32
    },
    {
      "dishId": 191,
      "ingredientId": 33
    },
    {
      "dishId": 191,
      "ingredientId": 34
    },
    {
      "dishId": 192,
      "ingredientId": 44
    },
    {
      "dishId": 193,
      "ingredientId": 7
    },
    {
      "dishId": 193,
      "ingredientId": 16
    },
    {
      "dishId": 194,
      "ingredientId": 7
    },
    {
      "dishId": 194,
      "ingredientId": 12
    },
    {
      "dishId": 194,
      "ingredientId": 20
    },
    {
      "dishId": 195,
      "ingredientId": 7
    },
    {
      "dishId": 195,
      "ingredientId": 18
    },
    {
      "dishId": 196,
      "ingredientId": 7
    },
    {
      "dishId": 197,
      "ingredientId": 7
    },
    {
      "dishId": 197,
      "ingredientId": 19
    },
    {
      "dishId": 198,
      "ingredientId": 7
    },
    {
      "dishId": 198,
      "ingredientId": 19
    },
    {
      "dishId": 199,
      "ingredientId": 7
    },
    {
      "dishId": 199,
      "ingredientId": 17
    }
  ],
  "story": [
    {
      "id": 1,
      "name": "Mai An",
      "location": "Hà Nội",
      "initials": "MA",
      "text": "Một buổi sáng chậm lại, một bát phở nóng và những con phố đầy hương vị. Sài Gòn luôn có điều mới để khám phá."
    },
    {
      "id": 2,
      "name": "Hải Minh",
      "location": "Đà Nẵng",
      "initials": "HM",
      "text": "Tôi thích cách một món ăn kể câu chuyện về nơi chốn. Từ cơm tấm đến gỏi cuốn, mỗi lựa chọn là một cảm hứng."
    },
    {
      "id": 3,
      "name": "Linh Chi",
      "location": "Sài Gòn",
      "initials": "LC",
      "text": "Đôi khi hành trình thú vị nhất bắt đầu ngay trong thành phố mình sống. Một góc nhỏ và một hương vị thân quen."
    },
    {
      "id": 4,
      "name": "Thảo Vy",
      "location": "Huế",
      "initials": "TV",
      "text": "Rau thơm, chút sả và nước dùng nóng. Những hương vị giản dị làm nên một ngày thật dễ chịu."
    },
    {
      "id": 5,
      "name": "Quốc Nam",
      "location": "Cần Thơ",
      "initials": "QN",
      "text": "Thành phố rộng lớn, nhưng một bữa cơm ngon khiến mọi thứ gần gũi hơn. Tôi luôn muốn thử thêm một món mới."
    },
    {
      "id": 6,
      "name": "Ngọc Hà",
      "location": "Hải Phòng",
      "initials": "NH",
      "text": "Một chiếc bánh giòn, một ly nước mát và cuộc trò chuyện dài. Những kỷ niệm đẹp thường đến từ điều nhỏ nhất."
    }
  ],
  "restaurantImportArchive": [
    {
      "legacyId": 1,
      "record": {
        "id": 1,
        "name": "Phở Minh (Sài Gòn)",
        "price": 150000,
        "category": "Noodles",
        "available": true,
        "createdAt": "2026-10-12T04:01:20.902",
        "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/8eff85a3241042d3b28c52b6a1bd26fb.jpg?format=webp&w=500&h=500",
        "importKey": null,
        "photoType": "main_dish",
        "priceLabel": "On a budget",
        "searchText": "",
        "description": "Michelin Guide: Noodles. On a budget.",
        "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/pho-minh",
        "priceMaxVnd": 150000,
        "priceMinVnd": 0,
        "priceSymbol": "₫",
        "restaurantId": null
      },
      "archivedAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "legacyId": 2,
      "record": {
        "id": 2,
        "name": "Xôi Gà Number One",
        "price": 150000,
        "category": "Street Food",
        "available": true,
        "createdAt": "2026-10-12T04:01:20.902",
        "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/e2fc228b2fa3436ab4d6f03f60907b0f.jpeg?format=webp&w=500&h=500",
        "importKey": null,
        "photoType": "main_dish",
        "priceLabel": "On a budget",
        "searchText": "",
        "description": "Michelin Guide: Street Food. On a budget.",
        "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/xoi-ga-number-one",
        "priceMaxVnd": 150000,
        "priceMinVnd": 0,
        "priceSymbol": "₫",
        "restaurantId": null
      },
      "archivedAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "legacyId": 3,
      "record": {
        "id": 3,
        "name": "Hoa Túc (Sài Gòn)",
        "price": 500000,
        "category": "Vietnamese",
        "available": true,
        "createdAt": "2026-10-12T04:01:20.902",
        "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/e5eb491180a145ca89d22a61734860fa.png?format=webp&w=500&h=500",
        "importKey": null,
        "photoType": "main_dish",
        "priceLabel": "A moderate spend",
        "searchText": "",
        "description": "Michelin Guide: Vietnamese. A moderate spend.",
        "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/hoa-tuc",
        "priceMaxVnd": 500000,
        "priceMinVnd": 150000,
        "priceSymbol": "₫₫",
        "restaurantId": null
      },
      "archivedAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "legacyId": 4,
      "record": {
        "id": 4,
        "name": "Vietnam House",
        "price": 500000,
        "category": "Vietnamese",
        "available": true,
        "createdAt": "2026-10-12T04:01:20.902",
        "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/4a9b7c6b6bfe4c488f7fcf768ef65e6b.jpg?format=webp&w=500&h=500",
        "importKey": null,
        "photoType": "starter",
        "priceLabel": "A moderate spend",
        "searchText": "",
        "description": "Michelin Guide: Vietnamese. A moderate spend.",
        "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/vietnam-house",
        "priceMaxVnd": 500000,
        "priceMinVnd": 150000,
        "priceSymbol": "₫₫",
        "restaurantId": null
      },
      "archivedAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "legacyId": 5,
      "record": {
        "id": 5,
        "name": "The Monkey Gallery Dining",
        "price": 1000000,
        "category": "Vietnamese Contemporary",
        "available": true,
        "createdAt": "2026-10-12T04:01:20.902",
        "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/67445ca316c242578d1d225e9ef60d1c.jpeg?format=webp&w=500&h=500",
        "importKey": null,
        "photoType": "main_dish",
        "priceLabel": "Spare no expense",
        "searchText": "",
        "description": "Michelin Guide: Vietnamese Contemporary. Spare no expense.",
        "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/the-monkey-gallery-dining",
        "priceMaxVnd": null,
        "priceMinVnd": 1000000,
        "priceSymbol": "₫₫₫₫",
        "restaurantId": null
      },
      "archivedAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "legacyId": 6,
      "record": {
        "id": 6,
        "name": "Bếp Mẹ ỉn (Le Thanh Ton Street)",
        "price": 150000,
        "category": "Vietnamese",
        "available": true,
        "createdAt": "2026-10-12T04:01:20.902",
        "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/58ca3c105bc740f5bf4edca36bd831ac.jpeg?format=webp&w=500&h=500",
        "importKey": null,
        "photoType": "main_dish",
        "priceLabel": "On a budget",
        "searchText": "",
        "description": "Michelin Guide: Vietnamese. On a budget.",
        "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/bep-me-in-le-thanh-ton",
        "priceMaxVnd": 150000,
        "priceMinVnd": 0,
        "priceSymbol": "₫",
        "restaurantId": null
      },
      "archivedAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "legacyId": 7,
      "record": {
        "id": 7,
        "name": "Ănăn Saigon",
        "price": 500000,
        "category": "Vietnamese Contemporary",
        "available": true,
        "createdAt": "2026-10-12T04:01:20.902",
        "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/a48e444cf62f43c9add3aa82c029e66f.jpg?format=webp&w=500&h=500",
        "importKey": null,
        "photoType": "main_dish",
        "priceLabel": "A moderate spend",
        "searchText": "",
        "description": "Michelin Guide: Vietnamese Contemporary. A moderate spend.",
        "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/anan-saigon",
        "priceMaxVnd": 500000,
        "priceMinVnd": 150000,
        "priceSymbol": "₫₫",
        "restaurantId": null
      },
      "archivedAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "legacyId": 8,
      "record": {
        "id": 8,
        "name": "Rice Field",
        "price": 500000,
        "category": "Vietnamese",
        "available": true,
        "createdAt": "2026-10-12T04:01:20.902",
        "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/e97b984842f14438a5be9981d57876cb.jpg?format=webp&w=500&h=500",
        "importKey": null,
        "photoType": "starter",
        "priceLabel": "A moderate spend",
        "searchText": "",
        "description": "Michelin Guide: Vietnamese. A moderate spend.",
        "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/rice-field",
        "priceMaxVnd": 500000,
        "priceMinVnd": 150000,
        "priceSymbol": "₫₫",
        "restaurantId": null
      },
      "archivedAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "legacyId": 9,
      "record": {
        "id": 9,
        "name": "Phở Việt Nam (Bến Thành)",
        "price": 150000,
        "category": "Noodles",
        "available": true,
        "createdAt": "2026-10-12T04:01:20.902",
        "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/a5740eb6c7614a07817fc6a8c13a6390.jpg?format=webp&w=500&h=500",
        "importKey": null,
        "photoType": "main_dish",
        "priceLabel": "On a budget",
        "searchText": "",
        "description": "Michelin Guide: Noodles. On a budget.",
        "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/pho-viet-nam-district-1",
        "priceMaxVnd": 150000,
        "priceMinVnd": 0,
        "priceSymbol": "₫",
        "restaurantId": null
      },
      "archivedAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "legacyId": 10,
      "record": {
        "id": 10,
        "name": "Bà Cô Lốc Cốc",
        "price": 500000,
        "category": "Fish and Seafood",
        "available": true,
        "createdAt": "2026-10-12T04:01:20.902",
        "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/fc6b397fb0e44f44ba95fec351e212df.jpeg?format=webp&w=500&h=500",
        "importKey": null,
        "photoType": "main_dish",
        "priceLabel": "A moderate spend",
        "searchText": "",
        "description": "Michelin Guide: Fish and Seafood. A moderate spend.",
        "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/ba-co-loc-coc",
        "priceMaxVnd": 500000,
        "priceMinVnd": 150000,
        "priceSymbol": "₫₫",
        "restaurantId": null
      },
      "archivedAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "legacyId": 11,
      "record": {
        "id": 11,
        "name": "Béo Ơi",
        "price": 150000,
        "category": "Vietnamese",
        "available": true,
        "createdAt": "2026-10-12T04:01:20.902",
        "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/3ca23d004c774f3a8bf32373d628886f.jpeg?format=webp&w=500&h=500",
        "importKey": null,
        "photoType": "main_dish",
        "priceLabel": "On a budget",
        "searchText": "",
        "description": "Michelin Guide: Vietnamese. On a budget.",
        "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/beo-oi",
        "priceMaxVnd": 150000,
        "priceMinVnd": 0,
        "priceSymbol": "₫",
        "restaurantId": null
      },
      "archivedAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "legacyId": 12,
      "record": {
        "id": 12,
        "name": "Bờm",
        "price": 500000,
        "category": "Vietnamese Contemporary",
        "available": true,
        "createdAt": "2026-10-12T04:01:20.902",
        "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/a5b2412d51304800b573cf5b507dd2a1.jpeg?format=webp&w=500&h=500",
        "importKey": null,
        "photoType": "main_dish",
        "priceLabel": "A moderate spend",
        "searchText": "",
        "description": "Michelin Guide: Vietnamese Contemporary. A moderate spend.",
        "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/bom-1205510",
        "priceMaxVnd": 500000,
        "priceMinVnd": 150000,
        "priceSymbol": "₫₫",
        "restaurantId": null
      },
      "archivedAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "legacyId": 13,
      "record": {
        "id": 13,
        "name": "Chay Garden (Xuan Hoa)",
        "price": 150000,
        "category": "Vegetarian",
        "available": true,
        "createdAt": "2026-10-12T04:01:20.902",
        "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/5e579bc34b9f4c8b95718527ea67509a.jpg?format=webp&w=500&h=500",
        "importKey": null,
        "photoType": "main_dish",
        "priceLabel": "On a budget",
        "searchText": "",
        "description": "Michelin Guide: Vegetarian. On a budget.",
        "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/chay-garden",
        "priceMaxVnd": 150000,
        "priceMinVnd": 0,
        "priceSymbol": "₫",
        "restaurantId": null
      },
      "archivedAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "legacyId": 14,
      "record": {
        "id": 14,
        "name": "Nhà Tú",
        "price": 150000,
        "category": "Vietnamese",
        "available": true,
        "createdAt": "2026-10-12T04:01:20.902",
        "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/82c8e41e00334475b654d1b146eb550a.jpg?format=webp&w=500&h=500",
        "importKey": null,
        "photoType": "starter",
        "priceLabel": "On a budget",
        "searchText": "",
        "description": "Michelin Guide: Vietnamese. On a budget.",
        "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/nha-tu",
        "priceMaxVnd": 150000,
        "priceMinVnd": 0,
        "priceSymbol": "₫",
        "restaurantId": null
      },
      "archivedAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "legacyId": 15,
      "record": {
        "id": 15,
        "name": "Đông Phố",
        "price": 500000,
        "category": "Vietnamese",
        "available": true,
        "createdAt": "2026-10-12T04:01:20.902",
        "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/f9493b80496d496692b175e36d8da01e.jpg?format=webp&w=500&h=500",
        "importKey": null,
        "photoType": "starter",
        "priceLabel": "A moderate spend",
        "searchText": "",
        "description": "Michelin Guide: Vietnamese. A moderate spend.",
        "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/%C4%91ong-pho",
        "priceMaxVnd": 500000,
        "priceMinVnd": 150000,
        "priceSymbol": "₫₫",
        "restaurantId": null
      },
      "archivedAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "legacyId": 16,
      "record": {
        "id": 16,
        "name": "Cô Liêng",
        "price": 150000,
        "category": "Vietnamese",
        "available": true,
        "createdAt": "2026-10-12T04:01:20.902",
        "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/fc0c5adfa2ec4d22a34f90cfa4fda655.jpeg?format=webp&w=500&h=500",
        "importKey": null,
        "photoType": "main_dish",
        "priceLabel": "On a budget",
        "searchText": "",
        "description": "Michelin Guide: Vietnamese. On a budget.",
        "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/co-lieng",
        "priceMaxVnd": 150000,
        "priceMinVnd": 0,
        "priceSymbol": "₫",
        "restaurantId": null
      },
      "archivedAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "legacyId": 17,
      "record": {
        "id": 17,
        "name": "Thúy 94 Cũ",
        "price": 500000,
        "category": "Seafood",
        "available": true,
        "createdAt": "2026-10-12T04:01:20.902",
        "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/6d8eb96bc6724eae8023545f498ec819.jpeg?format=webp&w=500&h=500",
        "importKey": null,
        "photoType": "main_dish",
        "priceLabel": "A moderate spend",
        "searchText": "",
        "description": "Michelin Guide: Seafood. A moderate spend.",
        "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/thuy-94-cu",
        "priceMaxVnd": 500000,
        "priceMinVnd": 150000,
        "priceSymbol": "₫₫",
        "restaurantId": null
      },
      "archivedAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "legacyId": 18,
      "record": {
        "id": 18,
        "name": "Hoi An Sense",
        "price": 500000,
        "category": "Vietnamese",
        "available": true,
        "createdAt": "2026-10-12T04:01:20.902",
        "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/6c4c973e7e0847fcb81d160955f41384.jpeg?format=webp&w=500&h=500",
        "importKey": null,
        "photoType": "main_dish",
        "priceLabel": "A moderate spend",
        "searchText": "",
        "description": "Michelin Guide: Vietnamese. A moderate spend.",
        "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/hoi-an-sense",
        "priceMaxVnd": 500000,
        "priceMinVnd": 150000,
        "priceSymbol": "₫₫",
        "restaurantId": null
      },
      "archivedAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "legacyId": 19,
      "record": {
        "id": 19,
        "name": "Phở Hương Bình",
        "price": 150000,
        "category": "Noodles",
        "available": true,
        "createdAt": "2026-10-12T04:01:20.902",
        "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/1812e3cd1d7e4ee2ab438af9cd5b7d6a.jpeg?format=webp&w=500&h=500",
        "importKey": null,
        "photoType": "main_dish",
        "priceLabel": "On a budget",
        "searchText": "",
        "description": "Michelin Guide: Noodles. On a budget.",
        "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/pho-huong-binh",
        "priceMaxVnd": 150000,
        "priceMinVnd": 0,
        "priceSymbol": "₫",
        "restaurantId": null
      },
      "archivedAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "legacyId": 20,
      "record": {
        "id": 20,
        "name": "Bánh Cuốn Tây Hồ 127",
        "price": 150000,
        "category": "Vietnamese",
        "available": true,
        "createdAt": "2026-10-12T04:01:20.902",
        "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/bbd3dbffbcdf48d4aa3c72acc1893f74.jpeg?format=webp&w=500&h=500",
        "importKey": null,
        "photoType": "main_dish",
        "priceLabel": "On a budget",
        "searchText": "",
        "description": "Michelin Guide: Vietnamese. On a budget.",
        "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/banh-cuon-tay-ho-127",
        "priceMaxVnd": 150000,
        "priceMinVnd": 0,
        "priceSymbol": "₫",
        "restaurantId": null
      },
      "archivedAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "legacyId": 21,
      "record": {
        "id": 21,
        "name": "Bún Bò Huế Cô Như",
        "price": 150000,
        "category": "Noodles",
        "available": true,
        "createdAt": "2026-10-12T04:01:20.902",
        "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/2298188b55ab41f9a9e9af3d9a3413c9.jpeg?format=webp&w=500&h=500",
        "importKey": null,
        "photoType": "main_dish",
        "priceLabel": "On a budget",
        "searchText": "",
        "description": "Michelin Guide: Noodles. On a budget.",
        "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/bun-bo-hue-co-nhu",
        "priceMaxVnd": 150000,
        "priceMinVnd": 0,
        "priceSymbol": "₫",
        "restaurantId": null
      },
      "archivedAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "legacyId": 22,
      "record": {
        "id": 22,
        "name": "Phở Phượng",
        "price": 150000,
        "category": "Street Food",
        "available": true,
        "createdAt": "2026-10-12T04:01:20.902",
        "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/a577193b30fb4a9d94353dd075ee72b3.jpeg?format=webp&w=500&h=500",
        "importKey": null,
        "photoType": "main_dish",
        "priceLabel": "On a budget",
        "searchText": "",
        "description": "Michelin Guide: Street Food. On a budget.",
        "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/pho-phuong",
        "priceMaxVnd": 150000,
        "priceMinVnd": 0,
        "priceSymbol": "₫",
        "restaurantId": null
      },
      "archivedAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "legacyId": 23,
      "record": {
        "id": 23,
        "name": "Ốc Oanh",
        "price": 500000,
        "category": "Street Food",
        "available": true,
        "createdAt": "2026-10-12T04:01:20.902",
        "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/cefd030fd34e484e9cf1f2c28bccbaa3.jpeg?format=webp&w=500&h=500",
        "importKey": null,
        "photoType": "main_dish",
        "priceLabel": "A moderate spend",
        "searchText": "",
        "description": "Michelin Guide: Street Food. A moderate spend.",
        "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/oc-oanh",
        "priceMaxVnd": 500000,
        "priceMinVnd": 150000,
        "priceSymbol": "₫₫",
        "restaurantId": null
      },
      "archivedAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "legacyId": 24,
      "record": {
        "id": 24,
        "name": "Bánh Xèo 46A",
        "price": 150000,
        "category": "Vietnamese",
        "available": true,
        "createdAt": "2026-10-12T04:01:20.902",
        "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/90562680ae5c47d58578cdfd31914dfc.jpeg?format=webp&w=500&h=500",
        "importKey": null,
        "photoType": "main_dish",
        "priceLabel": "On a budget",
        "searchText": "",
        "description": "Michelin Guide: Vietnamese. On a budget.",
        "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/banh-xeo-46a",
        "priceMaxVnd": 150000,
        "priceMinVnd": 0,
        "priceSymbol": "₫",
        "restaurantId": null
      },
      "archivedAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "legacyId": 25,
      "record": {
        "id": 25,
        "name": "Bếp Người Hội An",
        "price": 150000,
        "category": "Vietnamese",
        "available": true,
        "createdAt": "2026-10-12T04:01:20.902",
        "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/36b1ea2411da4190ac85d442b7c2e864.jpeg?format=webp&w=500&h=500",
        "importKey": null,
        "photoType": "main_dish",
        "priceLabel": "On a budget",
        "searchText": "",
        "description": "Michelin Guide: Vietnamese. On a budget.",
        "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/bep-nguoi-hoi-an",
        "priceMaxVnd": 150000,
        "priceMinVnd": 0,
        "priceSymbol": "₫",
        "restaurantId": null
      },
      "archivedAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "legacyId": 26,
      "record": {
        "id": 26,
        "name": "Hồng Phát (Bàn Cờ)",
        "price": 150000,
        "category": "Noodles",
        "available": true,
        "createdAt": "2026-10-12T04:01:20.902",
        "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/1fc5fb7c414149deb301f0f85cbe1b78.jpg?format=webp&w=500&h=500",
        "importKey": null,
        "photoType": "main_dish",
        "priceLabel": "On a budget",
        "searchText": "",
        "description": "Michelin Guide: Noodles. On a budget.",
        "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/hong-phat-district-3",
        "priceMaxVnd": 150000,
        "priceMinVnd": 0,
        "priceSymbol": "₫",
        "restaurantId": null
      },
      "archivedAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "legacyId": 27,
      "record": {
        "id": 27,
        "name": "Phở Hùng (Cầu Ông Lãnh)",
        "price": 150000,
        "category": "Noodles",
        "available": true,
        "createdAt": "2026-10-12T04:01:20.902",
        "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/63c43a73ae22492c8dc5504329a8ef38.jpeg?format=webp&w=500&h=500",
        "importKey": null,
        "photoType": "main_dish",
        "priceLabel": "On a budget",
        "searchText": "",
        "description": "Michelin Guide: Noodles. On a budget.",
        "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/pho-hung",
        "priceMaxVnd": 150000,
        "priceMinVnd": 0,
        "priceSymbol": "₫",
        "restaurantId": null
      },
      "archivedAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "legacyId": 28,
      "record": {
        "id": 28,
        "name": "Bún Bò Huế 14B",
        "price": 150000,
        "category": "Street Food",
        "available": true,
        "createdAt": "2026-10-12T04:01:20.902",
        "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/ca3054a1b5af4719ba458a21a7d4bf17.jpg?format=webp&w=500&h=500",
        "importKey": null,
        "photoType": "main_dish",
        "priceLabel": "On a budget",
        "searchText": "",
        "description": "Michelin Guide: Street Food. On a budget.",
        "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/bun-bo-hue-14b",
        "priceMaxVnd": 150000,
        "priceMinVnd": 0,
        "priceSymbol": "₫",
        "restaurantId": null
      },
      "archivedAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "legacyId": 29,
      "record": {
        "id": 29,
        "name": "Phở Chào",
        "price": 150000,
        "category": "Noodles",
        "available": true,
        "createdAt": "2026-10-12T04:01:20.902",
        "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/dbb1d7413fdd4edcbc31d74f09c45fa3.jpeg?format=webp&w=500&h=500",
        "importKey": null,
        "photoType": "main_dish",
        "priceLabel": "On a budget",
        "searchText": "",
        "description": "Michelin Guide: Noodles. On a budget.",
        "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/pho-chao",
        "priceMaxVnd": 150000,
        "priceMinVnd": 0,
        "priceSymbol": "₫",
        "restaurantId": null
      },
      "archivedAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "legacyId": 30,
      "record": {
        "id": 30,
        "name": "Tiệm Cơm Thố Chuyên Ký",
        "price": 150000,
        "category": "Cantonese",
        "available": true,
        "createdAt": "2026-10-12T04:01:20.902",
        "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/7ef430d105274448a65ffeab487f5068.jpeg?format=webp&w=500&h=500",
        "importKey": null,
        "photoType": "main_dish",
        "priceLabel": "On a budget",
        "searchText": "",
        "description": "Michelin Guide: Cantonese. On a budget.",
        "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/tiem-com-tho-chuyen-ky",
        "priceMaxVnd": 150000,
        "priceMinVnd": 0,
        "priceSymbol": "₫",
        "restaurantId": null
      },
      "archivedAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "legacyId": 31,
      "record": {
        "id": 31,
        "name": "Quán ăn Ngự Bình",
        "price": 150000,
        "category": "Vietnamese",
        "available": true,
        "createdAt": "2026-10-12T04:01:20.902",
        "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/28745ac2d1fa40b4a51786efd4878c47.jpeg?format=webp&w=500&h=500",
        "importKey": null,
        "photoType": "main_dish",
        "priceLabel": "On a budget",
        "searchText": "",
        "description": "Michelin Guide: Vietnamese. On a budget.",
        "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/quan-an-ngu-binh",
        "priceMaxVnd": 150000,
        "priceMinVnd": 0,
        "priceSymbol": "₫",
        "restaurantId": null
      },
      "archivedAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "legacyId": 32,
      "record": {
        "id": 32,
        "name": "Little Bear",
        "price": 500000,
        "category": "Vietnamese Contemporary",
        "available": true,
        "createdAt": "2026-10-12T04:01:20.902",
        "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/7bf944530c1749cf9bcf6e387a86e0c8.jpg?format=webp&w=500&h=500",
        "importKey": null,
        "photoType": "main_dish",
        "priceLabel": "A moderate spend",
        "searchText": "",
        "description": "Michelin Guide: Vietnamese Contemporary. A moderate spend.",
        "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/little-bear-1212889",
        "priceMaxVnd": 500000,
        "priceMinVnd": 150000,
        "priceSymbol": "₫₫",
        "restaurantId": null
      },
      "archivedAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "legacyId": 33,
      "record": {
        "id": 33,
        "name": "Phở Bò Phú Gia (Nhiêu Lộc)",
        "price": 150000,
        "category": "Noodles",
        "available": true,
        "createdAt": "2026-10-12T04:01:20.902",
        "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/69eff81a25924e62820a6dfcbe597a4b.jpeg?format=webp&w=500&h=500",
        "importKey": null,
        "photoType": "main_dish",
        "priceLabel": "On a budget",
        "searchText": "",
        "description": "Michelin Guide: Noodles. On a budget.",
        "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/pho-bo-phu-gia",
        "priceMaxVnd": 150000,
        "priceMinVnd": 0,
        "priceSymbol": "₫",
        "restaurantId": null
      },
      "archivedAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "legacyId": 34,
      "record": {
        "id": 34,
        "name": "Bún Thịt Nướng Hoàng Văn",
        "price": 150000,
        "category": "Noodles",
        "available": true,
        "createdAt": "2026-10-12T04:01:20.902",
        "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/477a90e43a9943c9b7d616340eae9bdc.jpeg?format=webp&w=500&h=500",
        "importKey": null,
        "photoType": "main_dish",
        "priceLabel": "On a budget",
        "searchText": "",
        "description": "Michelin Guide: Noodles. On a budget.",
        "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/bun-thit-nuong-hoang-van",
        "priceMaxVnd": 150000,
        "priceMinVnd": 0,
        "priceSymbol": "₫",
        "restaurantId": null
      },
      "archivedAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "legacyId": 35,
      "record": {
        "id": 35,
        "name": "Miên Saigon",
        "price": 1000000,
        "category": "Vietnamese Contemporary",
        "available": true,
        "createdAt": "2026-10-12T04:01:20.902",
        "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/7a1cc8d2cf3b47f6ae0b17a56bddc668.jpeg?format=webp&w=500&h=500",
        "importKey": null,
        "photoType": "starter",
        "priceLabel": "Spare no expense",
        "searchText": "",
        "description": "Michelin Guide: Vietnamese Contemporary. Spare no expense.",
        "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/mien-saigon",
        "priceMaxVnd": null,
        "priceMinVnd": 1000000,
        "priceSymbol": "₫₫₫₫",
        "restaurantId": null
      },
      "archivedAt": "2026-10-12T12:56:33.998Z"
    },
    {
      "legacyId": 36,
      "record": {
        "id": 36,
        "name": "Ốc Đào (Cầu Ông Lãnh)",
        "price": 150000,
        "category": "Fish and Seafood",
        "available": true,
        "createdAt": "2026-10-12T04:01:20.902",
        "imagePath": "https://prod-pics.guide.michelin.com/api/public/content/193f923462704373808cab898b4448ca.jpeg?format=webp&w=500&h=500",
        "importKey": null,
        "photoType": "main_dish",
        "priceLabel": "On a budget",
        "searchText": "",
        "description": "Michelin Guide: Fish and Seafood. On a budget.",
        "michelinUrl": "https://guide.michelin.com/en/ho-chi-minh/ho-chi-minh_2978179/restaurant/oc-%C4%91ao",
        "priceMaxVnd": 150000,
        "priceMinVnd": 0,
        "priceSymbol": "₫",
        "restaurantId": null
      },
      "archivedAt": "2026-10-12T12:56:33.998Z"
    }
  ]
};

const modelOrder = ['restaurant', 'chef', 'ingredient', 'dish', 'story', 'restaurantImportArchive'];
const tableNames = ['restaurants', 'chefs', 'ingredients', 'dishes', 'stories'];
const uniqueFields = { restaurant: ['catalogKey', 'michelinUrl'], chef: ['catalogKey'], ingredient: ['catalogKey'], dish: ['importKey'] };

function toPrismaData(row) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key,
    value !== null && ['createdAt', 'verifiedAt', 'archivedAt'].includes(key) ? new Date(value) : value]));
}

export async function seedDatabase(db) {
  return db.$transaction(async tx => {
    // Check BEFORE writing: never attach snapshot relations to unrelated existing IDs.
    for (const model of modelOrder) {
      const key = model === 'restaurantImportArchive' ? 'legacyId' : 'id';
      const existing = await tx[model].findMany();
      for (const row of seedData[model]) {
        const atId = existing.find(item => item[key] === row[key]);
        if (atId && Object.hasOwn(row, 'name') && atId.name !== row.name) {
          throw new Error(`Seed conflict: ${model} ${row[key]}. Use a new database.`);
        }
        for (const field of uniqueFields[model] || []) {
          if (row[field] != null && existing.some(item => item[field] === row[field] && item[key] !== row[key])) {
            throw new Error(`Seed conflict: ${model} ${field}. Use a new database.`);
          }
        }
      }
    }
    for (const model of modelOrder) {
      const key = model === 'restaurantImportArchive' ? 'legacyId' : 'id';
      for (const row of seedData[model]) {
        await tx[model].upsert({ where: { [key]: row[key] }, update: {}, create: toPrismaData(row) });
      }
    }
    for (const row of seedData.dishIngredient) {
      await tx.dishIngredient.upsert({
        where: { dishId_ingredientId: row }, update: {}, create: row,
      });
    }
    // Explicit IDs do not advance PostgreSQL sequences. Keep subsequent CRUD IDs safe.
    // Table names are fixed; unqualified names respect the connection's search_path.
    for (const table of tableNames) {
      await tx.$queryRawUnsafe(`SELECT setval(pg_get_serial_sequence('${table}', 'id'),
        GREATEST(COALESCE((SELECT MAX(id) FROM "${table}"), 1),
        nextval(pg_get_serial_sequence('${table}', 'id'))), true)`);
    }
    return Object.fromEntries(Object.entries(seedData).map(([model, rows]) => [model, rows.length]));
  }, { timeout: 120000 });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  let db;
  try {
    db = createDatabaseClient();
    const counts = await seedDatabase(db);
    console.log('Seed đầy đủ hoàn tất:', counts);
    console.log('Bản ghi đã có cùng ID được giữ nguyên. Không xóa dữ liệu.');
  } catch {
    // Do not print connection strings or database errors containing private values.
    console.error('Seed thất bại. Dùng database mới, kiểm tra DATABASE_URL và chạy db:generate, db:push trước. Nếu có dữ liệu trùng ID/khóa, seed sẽ dừng để tránh gán sai quan hệ.');
    process.exitCode = 1;
  } finally { await db?.$disconnect(); }
}
