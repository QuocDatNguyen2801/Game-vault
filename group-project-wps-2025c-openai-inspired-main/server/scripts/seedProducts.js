require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("../models/Product");
const { connectDB, connectDBTest } = require("../config/db");
const slugify = require("../utils/slugify");

const seedProducts = [
  {
    title: "Cyberpunk 2077",
    description: "Open-world action-adventure game",
    rating: 4.8,
    categories: ["RPG", "Action", "FPS"],
    price: 49.99,
    stock: 75,
    developer: "CD Projekt Red",
    publisher: "CD Projekt",
    releaseDate: new Date("2020-12-10"),
    image:
      "https://gaming-cdn.com/images/products/14769/616x353/cyberpunk-2077-ultimate-edition-ultimate-edition-pc-game-gog-com-cover.jpg?v=1748447646",
  },
  {
    title: "Elden Ring",
    description: "Epic action RPG from FromSoftware",
    rating: 4.8,
    categories: ["RPG", "Action", "Adventure"],
    price: 59.99,
    stock: 100,
    developer: "FromSoftware",
    publisher: "Bandai Namco",
    releaseDate: new Date("2022-02-25"),
    image:
      "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1245620/capsule_616x353.jpg?t=1748630546",
  },
  {
    title: "God of War",
    description: "Action-adventure based on Norse mythology",
    rating: 4.8,
    categories: ["RPG", "Action", "Adventure"],
    price: 59.99,
    stock: 90,
    developer: "Santa Monica Studio",
    publisher: "Sony Interactive Entertainment",
    releaseDate: new Date("2018-04-20"),
    image:
      "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1593500/capsule_616x353.jpg?t=1763059412",
  },
  {
    title: "The Witcher 3",
    description: "Fantasy RPG masterpiece",
    rating: 4.8,
    categories: ["RPG", "Fantasy"],
    price: 39.99,
    stock: 100,
    developer: "CD Projekt Red",
    publisher: "CD Projekt",
    releaseDate: new Date("2015-05-19"),
    image:
      "https://www.nintendo.com/eu/media/images/10_share_images/games_15/nintendo_switch_4/H2x1_NSwitch_TheWitcher3WildHuntCompleteEdition_enGB_image1600w.jpg",
  },
  {
    title: "Red Dead Redemption 2",
    description:
      "Winner of over 175 Game of the Year Awards and recipient of over 250 perfect scores.",
    rating: 4.9,
    categories: ["Action", "Adventure", "FPS"],
    price: 59.99,
    stock: 120,
    developer: "Rockstar Games",
    publisher: "Rockstar Games",
    releaseDate: new Date("2019-12-05"),
    image:
      "https://cdn1.epicgames.com/b30b6d1b4dfd4dcc93b5490be5e094e5/offer/RDR2476298253_Epic_Games_Wishlist_RDR2_2560x1440_V01-2560x1440-2a9ebe1f7ee202102555be202d5632ec.jpg",
  },
  {
    title: "Grand Theft Auto V",
    description:
      "Explore the award-winning world of Los Santos and Blaine County.",
    rating: 4.7,
    categories: ["Action", "Adventure", "Racing"],
    price: 29.99,
    stock: 200,
    developer: "Rockstar North",
    publisher: "Rockstar Games",
    releaseDate: new Date("2015-04-14"),
    image:
      "https://hoanghamobile.com/tin-tuc/wp-content/uploads/2024/10/cach-tai-gta-5-tren-pc-thumbnail.jpg",
  },
  {
    title: "Marvel's Spider-Man Remastered",
    description:
      "Play as Peter Parker fighting big crime in iconic Marvel's New York.",
    rating: 4.8,
    categories: ["Action", "Adventure"],
    price: 59.99,
    stock: 85,
    developer: "Insomniac Games",
    publisher: "PlayStation PC LLC",
    releaseDate: new Date("2022-08-12"),
    image: "https://i.ytimg.com/vi/1E051WtpyWg/maxresdefault.jpg",
  },
  {
    title: "Assassin's Creed Valhalla",
    description:
      "Become Eivor, a legendary Viking raider on a quest for glory.",
    rating: 4.5,
    categories: ["Action", "RPG", "Adventure"],
    price: 59.99,
    stock: 60,
    developer: "Ubisoft Montreal",
    publisher: "Ubisoft",
    releaseDate: new Date("2020-11-10"),
    image:
      "https://cdn1.epicgames.com/400347196e674de89c23cc2a7f2121db/offer/AC%20KINGDOM%20PREORDER_STANDARD%20EDITION_EPIC_Key_Art_Wide_3840x2160-3840x2160-485fe17203671386c71bde8110886c7d.jpg",
  },
  {
    title: "Sekiro: Shadows Die Twice",
    description:
      "Carve your own clever path to vengeance in this award-winning title.",
    rating: 4.9,
    categories: ["Action", "RPG"],
    price: 59.99,
    stock: 45,
    developer: "FromSoftware",
    publisher: "Activision",
    releaseDate: new Date("2019-03-22"),
    image: "https://i.ytimg.com/vi/eD5xx8IKO6c/maxresdefault.jpg",
  },
  {
    title: "DOOM Eternal",
    description:
      "Experience the ultimate combination of speed and power in FPS combat.",
    rating: 4.8,
    categories: ["FPS", "Action", "Horror"],
    price: 39.99,
    stock: 150,
    developer: "id Software",
    publisher: "Bethesda Softworks",
    releaseDate: new Date("2020-03-20"),
    image:
      "https://cdn2.fptshop.com.vn/unsafe/1920x0/filters:format(webp):quality(75)/2023_12_24_638390127747956500_doom-eternalt-thumb.jpg",
  },
  {
    title: "Call of Duty: Modern Warfare III",
    description:
      "In the direct sequel, Captain Price and Task Force 141 face the ultimate threat.",
    rating: 4.2,
    categories: ["FPS", "Action"],
    price: 69.99,
    stock: 300,
    developer: "Sledgehammer Games",
    publisher: "Activision",
    releaseDate: new Date("2023-11-10"),
    image:
      "https://cellphones.com.vn/sforum/wp-content/uploads/2023/11/phan-choi-don-modern-warfare-3-bi-game-thu-to-lam-cau-tha-vi-co-chay-deadline-thumb.jpg",
  },
  {
    title: "Apex Legends",
    description:
      "Conquer with character in this strategic battle royale shooter.",
    rating: 4.6,
    categories: ["FPS", "Action", "Strategy"],
    price: 0.0,
    stock: 999,
    developer: "Respawn",
    publisher: "Electronic Arts",
    releaseDate: new Date("2020-11-04"),
    image:
      "https://gamelade.vn/wp-content/uploads/2025/02/apex-legends-how-many-people-play-total-players_11zon.jpg",
  },
  {
    title: "Resident Evil 4",
    description:
      "Survival is just the beginning. A remake of the 2005 classic.",
    rating: 4.9,
    categories: ["Horror", "Action", "Adventure"],
    price: 59.99,
    stock: 80,
    developer: "Capcom",
    publisher: "Capcom",
    releaseDate: new Date("2023-03-24"),
    image:
      "https://assets.nintendo.com/image/upload/q_auto/f_auto/store/software/switch/70010000012858/f4d4fd20c956621c4a342a8cade2e366f0e3cd43765bb52eccd0fea32b1606ce",
  },
  {
    title: "Dead Space",
    description:
      "The sci-fi survival horror classic returns, completely rebuilt.",
    rating: 4.8,
    categories: ["Horror", "Action", "Sci-Fi"],
    price: 59.99,
    stock: 65,
    developer: "Motive",
    publisher: "Electronic Arts",
    releaseDate: new Date("2023-01-27"),
    image: "https://daominhha.net/wp-content/uploads/2020/12/dead_space-2.jpg",
  },
  {
    title: "Silent Hill 2",
    description:
      "Experience the psychological horror masterclass, remade for modern hardware.",
    rating: 4.7,
    categories: ["Horror", "Adventure", "Puzzle"],
    price: 69.99,
    stock: 50,
    developer: "Bloober Team",
    publisher: "Konami",
    releaseDate: new Date("2024-10-08"),
    image:
      "https://tedishop.vn/wp-content/uploads/2025/03/SILENT-HILL-2-5-Tedi-Shop.jpg",
  },
  {
    title: "Baldur's Gate 3",
    description:
      "A story-rich, party-based RPG set in the universe of Dungeons & Dragons.",
    rating: 4.9,
    categories: ["RPG", "Strategy", "Adventure"],
    price: 59.99,
    stock: 110,
    developer: "Larian Studios",
    publisher: "Larian Studios",
    releaseDate: new Date("2023-08-03"),
    image:
      "https://image.api.playstation.com/vulcan/ap/rnd/202308/1519/95cce955dc59d04e2ea5ab624a823ace14e9c5f7e24dfb8f.png",
  },
  {
    title: "Civilization VI",
    description: "Build an empire that will stand the test of time.",
    rating: 4.6,
    categories: ["Strategy", "Simulation"],
    price: 29.99,
    stock: 95,
    developer: "Firaxis Games",
    publisher: "2K",
    releaseDate: new Date("2016-10-21"),
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRpnW_7NS0mjOtB38WUagA-uWkuXZ1XjaKEmg&s",
  },
  {
    title: "Final Fantasy VII Remake Intergrade",
    description: "A reimagining of one of the most visionary games ever.",
    rating: 4.8,
    categories: ["RPG", "Action"],
    price: 69.99,
    stock: 70,
    developer: "Square Enix",
    publisher: "Square Enix",
    releaseDate: new Date("2022-06-17"),
    image:
      "https://fyre.cdn.sewest.net/ffvii-hub/65f3b7820aeeba20796c2d27/finalfantasyviiremakeintergrade-buy-large-1475187013468387.jpg?quality=85&width=3840",
  },
  {
    title: "Forza Horizon 5",
    description:
      "Explore the vibrant and ever-evolving open world landscapes of Mexico.",
    rating: 4.8,
    categories: ["Racing", "Simulation", "Sports"],
    price: 59.99,
    stock: 130,
    developer: "Playground Games",
    publisher: "Xbox Game Studios",
    releaseDate: new Date("2021-11-09"),
    image:
      "https://prodforza.blob.core.windows.net/strapi-uploads/assets/FH_5_German_group_01_F_Mnet_Story_1120x630_e5187001ee.jpeg",
  },
  {
    title: "F1 23",
    description:
      "Be the last to brake in EA SPORTS F1 23, the official video game.",
    rating: 4.5,
    categories: ["Racing", "Sports", "Simulation"],
    price: 69.99,
    stock: 88,
    developer: "Codemasters",
    publisher: "Electronic Arts",
    releaseDate: new Date("2023-06-16"),
    image:
      "https://media.contentapi.ea.com/content/dam/ea/f1/f1-23/common/articles/launch-article/f123-launch-article-featured-16x9.jpg.adapt.crop191x100.628p.jpg",
  },
  {
    title: "EA SPORTS FC 24",
    description: "The next chapter in a more innovative future of football.",
    rating: 4.3,
    categories: ["Sports", "Simulation"],
    price: 69.99,
    stock: 250,
    developer: "EA Canada",
    publisher: "Electronic Arts",
    releaseDate: new Date("2023-09-29"),
    image:
      "https://hoanghamobile.com/tin-tuc/wp-content/uploads/2024/01/EA-SPORTS-FC%E2%84%A2-24.jpg",
  },
  {
    title: "NBA 2K24",
    description: "Experience hoops culture in NBA 2K24.",
    rating: 4.0,
    categories: ["Sports", "Simulation"],
    price: 59.99,
    stock: 140,
    developer: "Visual Concepts",
    publisher: "2K",
    releaseDate: new Date("2023-09-08"),
    image: "https://i.ytimg.com/vi/QfkU3raJy2c/maxresdefault.jpg",
  },
  {
    title: "Portal 2",
    description:
      "The perpetual testing initiative has been expanded to allow you to design co-op puzzles.",
    rating: 5.0,
    categories: ["Puzzle", "Adventure", "FPS"],
    price: 9.99,
    stock: 500,
    developer: "Valve",
    publisher: "Valve",
    releaseDate: new Date("2011-04-19"),
    image:
      "https://cdn2.fptshop.com.vn/unsafe/1920x0/filters:format(webp):quality(75)/2024_1_5_638400418436771938_portal-2-tua-game-phieu-luu-trong-the-gioi-hau-tan-the-cuc-cuon-danh-cho-pc-6.jpg",
  },
  {
    title: "Stardew Valley",
    description:
      "You've inherited your grandfather's old farm plot in Stardew Valley.",
    rating: 4.9,
    categories: ["Simulation", "RPG", "Indie"],
    price: 14.99,
    stock: 300,
    developer: "ConcernedApe",
    publisher: "ConcernedApe",
    releaseDate: new Date("2016-02-26"),
    image:
      "https://kamikey.com/wp-content/uploads/2024/12/Stardew-Valley-min.jpg",
  },
  {
    title: "Hollow Knight",
    description:
      "Forge your own path in Hollow Knight! An epic action adventure through a vast ruined kingdom.",
    rating: 4.9,
    categories: ["Action", "Adventure", "Indie"],
    price: 14.99,
    stock: 220,
    developer: "Team Cherry",
    publisher: "Team Cherry",
    releaseDate: new Date("2017-02-24"),
    image:
      "https://assets.nintendo.com/image/upload/c_fill,w_1200/q_auto:best/f_auto/dpr_2.0/store/software/switch/70010000003208/4643fb058642335c523910f3a7910575f56372f612f7c0c9a497aaae978d3e51",
  },
  {
    title: "Hades",
    description:
      "Defy the god of the dead as you hack and slash out of the Underworld.",
    rating: 4.9,
    categories: ["Action", "RPG", "Indie"],
    price: 24.99,
    stock: 180,
    developer: "Supergiant Games",
    publisher: "Supergiant Games",
    releaseDate: new Date("2020-09-17"),
    image:
      "https://cdn1.epicgames.com/min/offer/2560x1440-2560x1440-5e710b93049cbd2125cf0261dcfbf943.jpg",
  },
  {
    title: "Cities: Skylines II",
    description:
      "Raise a city from the ground up and transform it into a thriving metropolis.",
    rating: 4.4,
    categories: ["Simulation", "Strategy"],
    price: 49.99,
    stock: 60,
    developer: "Colossal Order Ltd.",
    publisher: "Paradox Interactive",
    releaseDate: new Date("2023-10-24"),
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRDwik5gN2f53-XZsfHAW_74nbley7f6rur5A&s",
  },
  {
    title: "Terraria",
    description:
      "Dig, fight, explore, build! Nothing is impossible in this action-packed adventure game.",
    rating: 4.9,
    categories: ["Adventure", "RPG", "Indie"],
    price: 9.99,
    stock: 400,
    developer: "Re-Logic",
    publisher: "Re-Logic",
    releaseDate: new Date("2011-05-16"),
    image:
      "https://hoanghamobile.com/tin-tuc/wp-content/uploads/2024/01/terraria.jpg",
  },
  {
    title: "The Last of Us Part I",
    description:
      "Experience the emotional storytelling and unforgettable characters in The Last of Us, winner of over 200 Game of the Year awards.",
    rating: 4.8,
    categories: ["Action", "Adventure", "Horror"],
    price: 59.99,
    stock: 95,
    developer: "Naughty Dog LLC",
    publisher: "PlayStation PC LLC",
    releaseDate: new Date("2023-03-28"),
    image:
      "https://image.api.playstation.com/vulcan/ap/rnd/202206/0720/eEczyEMDd2BLa3dtkGJVE9Id.png",
  },
  {
    title: "Ghost of Tsushima Director's Cut",
    description:
      "Forge a new path and wage an unconventional war for the freedom of Tsushima.",
    rating: 4.9,
    categories: ["Action", "Adventure", "RPG"],
    price: 59.99,
    stock: 110,
    developer: "Sucker Punch Productions",
    publisher: "PlayStation PC LLC",
    releaseDate: new Date("2024-05-16"),
    image:
      "https://cdn1.epicgames.com/offer/6e6aa039c73347b885803de65ac5d3db/EGS_GhostofTsushima_SuckerPunchProductions_S1_2560x1440-c33a63e5da4518de6e32299bedf7efab",
  },
];

console.log(`Seeding ${seedProducts.length} products...`);
const importData = async () => {
  try {
    // Choose your target DB
    // await connectDB();
    await connectDBTest();

    const prepared = seedProducts.map((p) => ({
      ...p,
      slug: p.slug || slugify(p.title),
      releaseDate: p.releaseDate ? new Date(p.releaseDate) : undefined,
    }));

    await Product.deleteMany({});
    const inserted = await Product.insertMany(prepared, { ordered: true });
    console.log(`Seeded products: ${inserted.length}`);
  } catch (err) {
    console.error("Seeding failed:", err);
  }

  await mongoose.connection.close();
  process.exit();
};

importData();
