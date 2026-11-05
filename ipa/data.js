// 48 个国际音标：分类与音标符号参考新东方国际音标表
// https://www.xdf.cn/zhuanti/bd-phonetic-alphabet-card/index.html
// 音标音频已下载到本地 audio/ 目录（原为新东方公开页面中的发音文件，仅作学习参考）。

const IPA_AUDIO_BASE = 'audio/';

// 每个音标对应的音频文件（按原站音频映射）
const IPA_AUDIO_FILES = {
  '0-0-0-0': '496fa8c5b185e9d155d7.mp3', '0-0-0-1': '9eeb45ac15980f053465.mp3',
  '0-0-0-2': '51f575eab8eb20b5fbf7.mp3', '0-0-0-3': '0d692636a009ea99b9f9.mp3',
  '0-0-1-0': '2b2c11bd1dcf81f786f0.mp3', '0-0-1-1': '04c02a21344cc0750a68.mp3',
  '0-0-1-2': '1c0775f0ef22273a7e85.mp3', '0-0-2-0': '45f67d333cfcb525cd4f.mp3',
  '0-0-2-1': 'ef8b714cea50701066b8.mp3', '0-0-2-2': 'bdd75c97619e90b5035d.mp3',
  '0-0-2-3': '9bf1a8bbcfc0c68ee326.mp3', '0-0-2-4': 'db4b962669f0c8e54737.mp3',
  '0-1-0-0': '28dc047b815750a6c5ee.mp3', '0-1-0-1': 'a83bc6c3a61e526de4ba.mp3',
  '0-1-0-2': 'c037f2e2fa30fc2711b8.mp3', '0-1-0-3': '8088e9346a7f75cb9b3c.mp3',
  '0-1-0-4': 'eae06d0db4f09c8f142c.mp3', '0-1-1-0': '6ff61b12d4e985c668ac.mp3',
  '0-1-1-1': 'f4eac5545f36dce272b8.mp3', '0-1-1-2': '1c01bd93c34338ca2081.mp3',
  '1-0-0-0': 'de1d50e7127182f7704d.mp3', '1-0-0-1': '5df0fde0b4fd99cee219.mp3',
  '1-0-0-2': '2d9c9b3d1ecdf33d659a.mp3', '1-0-1-0': 'a4209e9d9fd9709a1e76.mp3',
  '1-0-1-1': '9b0599891bade0c04c46.mp3', '1-0-1-2': 'c4a898ad851940132475.mp3',
  '1-0-1-3': 'd994b922bc7ec82646ff.mp3', '1-0-1-4': 'fc7ee36388f605e0a8c6.mp3',
  '1-0-2-0': 'a8bd1716350ce6be0735.mp3', '1-0-2-1': '4fad2aa8319f96b7034c.mp3',
  '1-0-2-2': 'b854e5495600f691d169.mp3', '1-1-0-0': 'f80e74ce936868ba6237.mp3',
  '1-1-0-1': '9a351a93fddb04c95162.mp3', '1-1-0-2': '9f1f33f7bd448e4b2262.mp3',
  '1-1-1-0': '1ee6a0a833eb5f5c40b4.mp3', '1-1-1-1': '21d839e770c9a38de14a.mp3',
  '1-1-1-2': '69df71ab3487efcb6bfa.mp3', '1-1-1-3': 'ab9c619dfb987add2069.mp3',
  '1-1-1-4': 'b6c52369def91ab36852.mp3', '1-1-2-0': '70e57979284156031990.mp3',
  '1-1-2-1': 'f981507e87b07895a224.mp3', '1-1-2-2': 'a9879c494d9159bdd679.mp3',
  '1-1-3-0': '01ef4567a1aa014ae30a.mp3', '1-1-3-1': '7f9f8679b25155de6b47.mp3',
  '1-1-3-2': '9f10d5b95482af1e9815.mp3', '1-1-4-0': 'a4c2272a2e766194a4a1.mp3',
  '1-1-5-0': 'fe61e7decb7acb2e0d8b.mp3', '1-1-5-1': '4e6d33cbf2ba6dfb91b7.mp3'
};

const IPA_DATA = [
  // ---------- 元音 · 单元音 ----------
  {
    id: '0-0-0-0', cat: '元音', sub: '单元音', group: '前元音', ipa: 'iː',
    tip: '嘴角向两边咧开，舌前部抬高，长音“衣”，声带振动。',
    words: [
      { w: 'see', ipa: '/siː/', zh: '看见', e: '👀' }, { w: 'tea', ipa: '/tiː/', zh: '茶', e: '🍵' },
      { w: 'green', ipa: '/ɡriːn/', zh: '绿色', e: '💚' }, { w: 'eat', ipa: '/iːt/', zh: '吃', e: '🍽️' }, { w: 'key', ipa: '/kiː/', zh: '钥匙', e: '🔑' }
    ]
  },
  {
    id: '0-0-0-1', cat: '元音', sub: '单元音', group: '前元音', ipa: 'ɪ',
    tip: '短促的“衣”，嘴形放松，不要拖长。',
    words: [
      { w: 'sit', ipa: '/sɪt/', zh: '坐', e: '🪑' }, { w: 'big', ipa: '/bɪɡ/', zh: '大的', e: '🐘' },
      { w: 'fish', ipa: '/fɪʃ/', zh: '鱼', e: '🐟' }, { w: 'milk', ipa: '/mɪlk/', zh: '牛奶', e: '🥛' }, { w: 'six', ipa: '/sɪks/', zh: '六', e: '6️⃣' }
    ]
  },
  {
    id: '0-0-0-2', cat: '元音', sub: '单元音', group: '前元音', ipa: 'e',
    tip: '嘴角微张，舌前部抬起，短促的“诶”。',
    words: [
      { w: 'bed', ipa: '/bed/', zh: '床', e: '🛏️' }, { w: 'pen', ipa: '/pen/', zh: '钢笔', e: '🖊️' },
      { w: 'red', ipa: '/red/', zh: '红色', e: '🔴' }, { w: 'ten', ipa: '/ten/', zh: '十', e: '🔟' }, { w: 'egg', ipa: '/eɡ/', zh: '鸡蛋', e: '🥚' }
    ]
  },
  {
    id: '0-0-0-3', cat: '元音', sub: '单元音', group: '前元音', ipa: 'æ',
    tip: '嘴张大，下巴放低，介于“啊”和“诶”之间。',
    words: [
      { w: 'cat', ipa: '/kæt/', zh: '猫', e: '🐱' }, { w: 'hat', ipa: '/hæt/', zh: '帽子', e: '🎩' },
      { w: 'apple', ipa: '/ˈæpl/', zh: '苹果', e: '🍎' }, { w: 'map', ipa: '/mæp/', zh: '地图', e: '🗺️' }, { w: 'bag', ipa: '/bæɡ/', zh: '包', e: '👜' }
    ]
  },
  {
    id: '0-0-1-0', cat: '元音', sub: '单元音', group: '中元音', ipa: 'ɜː',
    tip: '舌位居中，长音“儿”；美式发音会带卷舌。',
    words: [
      { w: 'bird', ipa: '/bɜːd/', zh: '鸟', e: '🐦' }, { w: 'girl', ipa: '/ɡɜːl/', zh: '女孩', e: '👧' },
      { w: 'nurse', ipa: '/nɜːs/', zh: '护士', e: '👩‍⚕️' }, { w: 'turn', ipa: '/tɜːn/', zh: '转动', e: '🔄' }, { w: 'learn', ipa: '/lɜːn/', zh: '学习', e: '📚' }
    ]
  },
  {
    id: '0-0-1-1', cat: '元音', sub: '单元音', group: '中元音', ipa: 'ə',
    tip: '最放松、最轻的“呃”，常出现在非重读音节。',
    words: [
      { w: 'about', ipa: '/əˈbaʊt/', zh: '关于', e: '💬' }, { w: 'sofa', ipa: '/ˈsəʊfə/', zh: '沙发', e: '🛋️' },
      { w: 'teacher', ipa: '/ˈtiːtʃə/', zh: '老师', e: '👩‍🏫' }, { w: 'banana', ipa: '/bəˈnɑːnə/', zh: '香蕉', e: '🍌' }, { w: 'ago', ipa: '/əˈɡəʊ/', zh: '以前', e: '⏳' }
    ]
  },
  {
    id: '0-0-1-2', cat: '元音', sub: '单元音', group: '中元音', ipa: 'ʌ',
    tip: '嘴半开，舌位居中偏后，短促有力的“啊”。',
    words: [
      { w: 'cup', ipa: '/kʌp/', zh: '杯子', e: '🥤' }, { w: 'bus', ipa: '/bʌs/', zh: '公交车', e: '🚌' },
      { w: 'sun', ipa: '/sʌn/', zh: '太阳', e: '☀️' }, { w: 'love', ipa: '/lʌv/', zh: '爱', e: '❤️' }, { w: 'money', ipa: '/ˈmʌni/', zh: '钱', e: '💰' }
    ]
  },
  {
    id: '0-0-2-0', cat: '元音', sub: '单元音', group: '后元音', ipa: 'uː',
    tip: '双唇收圆并向前突出，长音“乌”。',
    words: [
      { w: 'moon', ipa: '/muːn/', zh: '月亮', e: '🌙' }, { w: 'food', ipa: '/fuːd/', zh: '食物', e: '🍜' },
      { w: 'blue', ipa: '/bluː/', zh: '蓝色', e: '💙' }, { w: 'school', ipa: '/skuːl/', zh: '学校', e: '🏫' }, { w: 'shoe', ipa: '/ʃuː/', zh: '鞋', e: '👟' }
    ]
  },
  {
    id: '0-0-2-1', cat: '元音', sub: '单元音', group: '后元音', ipa: 'ʊ',
    tip: '双唇稍圆，短促的“乌”，不要拖长。',
    words: [
      { w: 'book', ipa: '/bʊk/', zh: '书', e: '📖' }, { w: 'look', ipa: '/lʊk/', zh: '看', e: '👀' },
      { w: 'good', ipa: '/ɡʊd/', zh: '好的', e: '👍' }, { w: 'put', ipa: '/pʊt/', zh: '放', e: '📥' }, { w: 'foot', ipa: '/fʊt/', zh: '脚', e: '🦶' }
    ]
  },
  {
    id: '0-0-2-2', cat: '元音', sub: '单元音', group: '后元音', ipa: 'ɔː',
    tip: '双唇收圆，舌后部抬起，长音“奥”。',
    words: [
      { w: 'door', ipa: '/dɔː/', zh: '门', e: '🚪' }, { w: 'ball', ipa: '/bɔːl/', zh: '球', e: '⚽' },
      { w: 'four', ipa: '/fɔː/', zh: '四', e: '4️⃣' }, { w: 'tall', ipa: '/tɔːl/', zh: '高的', e: '🦒' }, { w: 'horse', ipa: '/hɔːs/', zh: '马', e: '🐴' }
    ]
  },
  {
    id: '0-0-2-3', cat: '元音', sub: '单元音', group: '后元音', ipa: 'ɒ',
    tip: '嘴张大，双唇稍圆，短促的“奥”（英式音标）。',
    words: [
      { w: 'hot', ipa: '/hɒt/', zh: '热的', e: '🔥' }, { w: 'dog', ipa: '/dɒɡ/', zh: '狗', e: '🐶' },
      { w: 'box', ipa: '/bɒks/', zh: '盒子', e: '📦' }, { w: 'watch', ipa: '/wɒtʃ/', zh: '手表', e: '⌚' }, { w: 'clock', ipa: '/klɒk/', zh: '钟', e: '🕰️' }
    ]
  },
  {
    id: '0-0-2-4', cat: '元音', sub: '单元音', group: '后元音', ipa: 'ɑː',
    tip: '嘴张大，舌位靠后放低，长音“啊”。',
    words: [
      { w: 'car', ipa: '/kɑː/', zh: '汽车', e: '🚗' }, { w: 'star', ipa: '/stɑː/', zh: '星星', e: '⭐' },
      { w: 'park', ipa: '/pɑːk/', zh: '公园', e: '🏞️' }, { w: 'father', ipa: '/ˈfɑːðə/', zh: '爸爸', e: '👨' }, { w: 'farm', ipa: '/fɑːm/', zh: '农场', e: '🚜' }
    ]
  },

  // ---------- 元音 · 双元音 ----------
  {
    id: '0-1-0-0', cat: '元音', sub: '双元音', group: '开合双元音', ipa: 'eɪ',
    tip: '从“诶”滑向“衣”，前重后轻。',
    words: [
      { w: 'day', ipa: '/deɪ/', zh: '天', e: '☀️' }, { w: 'cake', ipa: '/keɪk/', zh: '蛋糕', e: '🍰' },
      { w: 'name', ipa: '/neɪm/', zh: '名字', e: '🏷️' }, { w: 'play', ipa: '/pleɪ/', zh: '玩', e: '🎮' }, { w: 'rain', ipa: '/reɪn/', zh: '雨', e: '🌧️' }
    ]
  },
  {
    id: '0-1-0-1', cat: '元音', sub: '双元音', group: '开合双元音', ipa: 'aɪ',
    tip: '从“啊”滑向“衣”，口形由大到小。',
    words: [
      { w: 'my', ipa: '/maɪ/', zh: '我的', e: '🙋' }, { w: 'bike', ipa: '/baɪk/', zh: '自行车', e: '🚲' },
      { w: 'five', ipa: '/faɪv/', zh: '五', e: '5️⃣' }, { w: 'time', ipa: '/taɪm/', zh: '时间', e: '⏰' }, { w: 'sky', ipa: '/skaɪ/', zh: '天空', e: '🌌' }
    ]
  },
  {
    id: '0-1-0-2', cat: '元音', sub: '双元音', group: '开合双元音', ipa: 'ɔɪ',
    tip: '从“奥”滑向“衣”，前重后轻。',
    words: [
      { w: 'boy', ipa: '/bɔɪ/', zh: '男孩', e: '👦' }, { w: 'toy', ipa: '/tɔɪ/', zh: '玩具', e: '🧸' },
      { w: 'coin', ipa: '/kɔɪn/', zh: '硬币', e: '🪙' }, { w: 'noise', ipa: '/nɔɪz/', zh: '噪音', e: '🔊' }, { w: 'point', ipa: '/pɔɪnt/', zh: '指', e: '👉' }
    ]
  },
  {
    id: '0-1-0-3', cat: '元音', sub: '双元音', group: '开合双元音', ipa: 'aʊ',
    tip: '从“啊”滑向“乌”，口形由大收圆。',
    words: [
      { w: 'cow', ipa: '/kaʊ/', zh: '奶牛', e: '🐄' }, { w: 'house', ipa: '/haʊs/', zh: '房子', e: '🏠' },
      { w: 'out', ipa: '/aʊt/', zh: '外面', e: '🚪' }, { w: 'now', ipa: '/naʊ/', zh: '现在', e: '⏰' }, { w: 'flower', ipa: '/ˈflaʊə/', zh: '花', e: '🌸' }
    ]
  },
  {
    id: '0-1-0-4', cat: '元音', sub: '双元音', group: '开合双元音', ipa: 'əʊ',
    tip: '从“呃”滑向“乌”，双唇逐渐收圆。',
    words: [
      { w: 'go', ipa: '/ɡəʊ/', zh: '去', e: '🚶' }, { w: 'home', ipa: '/həʊm/', zh: '家', e: '🏠' },
      { w: 'nose', ipa: '/nəʊz/', zh: '鼻子', e: '👃' }, { w: 'boat', ipa: '/bəʊt/', zh: '小船', e: '⛵' }, { w: 'snow', ipa: '/snəʊ/', zh: '雪', e: '❄️' }
    ]
  },
  {
    id: '0-1-1-0', cat: '元音', sub: '双元音', group: '集中双元音', ipa: 'ɪə',
    tip: '从“衣”滑向“呃”，结尾轻而松。',
    words: [
      { w: 'ear', ipa: '/ɪə/', zh: '耳朵', e: '👂' }, { w: 'near', ipa: '/nɪə/', zh: '近的', e: '📍' },
      { w: 'here', ipa: '/hɪə/', zh: '这里', e: '📍' }, { w: 'idea', ipa: '/aɪˈdɪə/', zh: '主意', e: '💡' }, { w: 'serious', ipa: '/ˈsɪəriəs/', zh: '严肃的', e: '😐' }
    ]
  },
  {
    id: '0-1-1-1', cat: '元音', sub: '双元音', group: '集中双元音', ipa: 'eə',
    tip: '从“诶”滑向“呃”，前重后轻。',
    words: [
      { w: 'air', ipa: '/eə/', zh: '空气', e: '💨' }, { w: 'hair', ipa: '/heə/', zh: '头发', e: '💇' },
      { w: 'chair', ipa: '/tʃeə/', zh: '椅子', e: '🪑' }, { w: 'bear', ipa: '/beə/', zh: '熊', e: '🐻' }, { w: 'care', ipa: '/keə/', zh: '关心', e: '🫶' }
    ]
  },
  {
    id: '0-1-1-2', cat: '元音', sub: '双元音', group: '集中双元音', ipa: 'ʊə',
    tip: '从“乌”滑向“呃”，双唇由圆到松。',
    words: [
      { w: 'tour', ipa: '/tʊə/', zh: '旅行', e: '🧳' }, { w: 'poor', ipa: '/pʊə/', zh: '贫穷的', e: '🥺' },
      { w: 'sure', ipa: '/ʃʊə/', zh: '确定的', e: '✅' }, { w: 'Europe', ipa: '/ˈjʊərəp/', zh: '欧洲', e: '🌍' }, { w: 'cure', ipa: '/kjʊə/', zh: '治愈', e: '💊' }
    ]
  },

  // ---------- 辅音 · 清辅音 ----------
  {
    id: '1-0-0-0', cat: '辅音', sub: '清辅音', group: '爆破音', ipa: 'p',
    tip: '双唇闭合后突然放开，只送气，声带不振动。',
    words: [
      { w: 'pig', ipa: '/pɪɡ/', zh: '猪', e: '🐷' }, { w: 'pen', ipa: '/pen/', zh: '钢笔', e: '🖊️' },
      { w: 'apple', ipa: '/ˈæpl/', zh: '苹果', e: '🍎' }, { w: 'map', ipa: '/mæp/', zh: '地图', e: '🗺️' }, { w: 'happy', ipa: '/ˈhæpi/', zh: '开心', e: '😄' }
    ]
  },
  {
    id: '1-0-0-1', cat: '辅音', sub: '清辅音', group: '爆破音', ipa: 't',
    tip: '舌尖抵住上齿龈，突然放开送气，声带不振动。',
    words: [
      { w: 'tiger', ipa: '/ˈtaɪɡə/', zh: '老虎', e: '🐯' }, { w: 'ten', ipa: '/ten/', zh: '十', e: '🔟' },
      { w: 'cat', ipa: '/kæt/', zh: '猫', e: '🐱' }, { w: 'water', ipa: '/ˈwɔːtə/', zh: '水', e: '💧' }, { w: 'sit', ipa: '/sɪt/', zh: '坐', e: '🪑' }
    ]
  },
  {
    id: '1-0-0-2', cat: '辅音', sub: '清辅音', group: '爆破音', ipa: 'k',
    tip: '舌根抵住软腭，突然放开送气，声带不振动。',
    words: [
      { w: 'cat', ipa: '/kæt/', zh: '猫', e: '🐱' }, { w: 'key', ipa: '/kiː/', zh: '钥匙', e: '🔑' },
      { w: 'book', ipa: '/bʊk/', zh: '书', e: '📖' }, { w: 'milk', ipa: '/mɪlk/', zh: '牛奶', e: '🥛' }, { w: 'school', ipa: '/skuːl/', zh: '学校', e: '🏫' }
    ]
  },
  {
    id: '1-0-1-0', cat: '辅音', sub: '清辅音', group: '摩擦音', ipa: 'f',
    tip: '上齿轻触下唇，气流从缝隙吹出，声带不振动。',
    words: [
      { w: 'fish', ipa: '/fɪʃ/', zh: '鱼', e: '🐟' }, { w: 'five', ipa: '/faɪv/', zh: '五', e: '5️⃣' },
      { w: 'coffee', ipa: '/ˈkɒfi/', zh: '咖啡', e: '☕' }, { w: 'leaf', ipa: '/liːf/', zh: '叶子', e: '🍃' }, { w: 'phone', ipa: '/fəʊn/', zh: '电话', e: '📱' }
    ]
  },
  {
    id: '1-0-1-1', cat: '辅音', sub: '清辅音', group: '摩擦音', ipa: 's',
    tip: '舌尖靠近上齿龈，气流从窄缝挤出，声带不振动。',
    words: [
      { w: 'sun', ipa: '/sʌn/', zh: '太阳', e: '☀️' }, { w: 'six', ipa: '/sɪks/', zh: '六', e: '6️⃣' },
      { w: 'bus', ipa: '/bʌs/', zh: '公交车', e: '🚌' }, { w: 'city', ipa: '/ˈsɪti/', zh: '城市', e: '🏙️' }, { w: 'dance', ipa: '/dɑːns/', zh: '跳舞', e: '💃' }
    ]
  },
  {
    id: '1-0-1-2', cat: '辅音', sub: '清辅音', group: '摩擦音', ipa: 'ʃ',
    tip: '双唇稍撅，舌尖靠近硬腭，像轻轻说“嘘”。',
    words: [
      { w: 'ship', ipa: '/ʃɪp/', zh: '船', e: '🚢' }, { w: 'shoe', ipa: '/ʃuː/', zh: '鞋', e: '👟' },
      { w: 'fish', ipa: '/fɪʃ/', zh: '鱼', e: '🐟' }, { w: 'station', ipa: '/ˈsteɪʃn/', zh: '车站', e: '🚉' }, { w: 'sure', ipa: '/ʃʊə/', zh: '确定的', e: '✅' }
    ]
  },
  {
    id: '1-0-1-3', cat: '辅音', sub: '清辅音', group: '摩擦音', ipa: 'θ',
    tip: '舌尖轻放在上下齿之间，向外吹气，声带不振动。',
    words: [
      { w: 'three', ipa: '/θriː/', zh: '三', e: '3️⃣' }, { w: 'think', ipa: '/θɪŋk/', zh: '想', e: '🤔' },
      { w: 'mouth', ipa: '/maʊθ/', zh: '嘴', e: '👄' }, { w: 'bath', ipa: '/bɑːθ/', zh: '洗澡', e: '🛁' }, { w: 'thank', ipa: '/θæŋk/', zh: '谢谢', e: '🙏' }
    ]
  },
  {
    id: '1-0-1-4', cat: '辅音', sub: '清辅音', group: '摩擦音', ipa: 'h',
    tip: '嘴张开，轻轻哈气，声带不振动。',
    words: [
      { w: 'hat', ipa: '/hæt/', zh: '帽子', e: '🎩' }, { w: 'hand', ipa: '/hænd/', zh: '手', e: '✋' },
      { w: 'hot', ipa: '/hɒt/', zh: '热的', e: '🔥' }, { w: 'behind', ipa: '/bɪˈhaɪnd/', zh: '在…后面', e: '🔙' }, { w: 'hello', ipa: '/həˈləʊ/', zh: '你好', e: '👋' }
    ]
  },
  {
    id: '1-0-2-0', cat: '辅音', sub: '清辅音', group: '破擦音', ipa: 'tʃ',
    tip: '舌尖抵住齿龈后部，突然放开摩擦，像轻声的“吃”。',
    words: [
      { w: 'chair', ipa: '/tʃeə/', zh: '椅子', e: '🪑' }, { w: 'cheese', ipa: '/tʃiːz/', zh: '奶酪', e: '🧀' },
      { w: 'watch', ipa: '/wɒtʃ/', zh: '手表', e: '⌚' }, { w: 'teacher', ipa: '/ˈtiːtʃə/', zh: '老师', e: '👩‍🏫' }, { w: 'church', ipa: '/tʃɜːtʃ/', zh: '教堂', e: '⛪' }
    ]
  },
  {
    id: '1-0-2-1', cat: '辅音', sub: '清辅音', group: '破擦音', ipa: 'tr',
    tip: 't 与 r 快速连读，像“戳”，声带不振动。',
    words: [
      { w: 'tree', ipa: '/triː/', zh: '树', e: '🌳' }, { w: 'train', ipa: '/treɪn/', zh: '火车', e: '🚂' },
      { w: 'trip', ipa: '/trɪp/', zh: '旅行', e: '🧳' }, { w: 'street', ipa: '/striːt/', zh: '街道', e: '🛣️' }, { w: 'try', ipa: '/traɪ/', zh: '尝试', e: '💪' }
    ]
  },
  {
    id: '1-0-2-2', cat: '辅音', sub: '清辅音', group: '破擦音', ipa: 'ts',
    tip: 't 与 s 快速连读，像“次”，声带不振动。',
    words: [
      { w: 'cats', ipa: '/kæts/', zh: '猫（复数）', e: '🐱' }, { w: 'hats', ipa: '/hæts/', zh: '帽子（复数）', e: '🎩' },
      { w: 'boats', ipa: '/bəʊts/', zh: '船（复数）', e: '⛵' }, { w: 'sweets', ipa: '/swiːts/', zh: '糖果', e: '🍬' }, { w: 'lots', ipa: '/lɒts/', zh: '许多', e: '📚' }
    ]
  },

  // ---------- 辅音 · 浊辅音 ----------
  {
    id: '1-1-0-0', cat: '辅音', sub: '浊辅音', group: '爆破音', ipa: 'b',
    tip: '双唇闭合后爆破，声带振动。',
    words: [
      { w: 'bag', ipa: '/bæɡ/', zh: '包', e: '👜' }, { w: 'book', ipa: '/bʊk/', zh: '书', e: '📖' },
      { w: 'big', ipa: '/bɪɡ/', zh: '大的', e: '🐘' }, { w: 'rabbit', ipa: '/ˈræbɪt/', zh: '兔子', e: '🐰' }, { w: 'job', ipa: '/dʒɒb/', zh: '工作', e: '💼' }
    ]
  },
  {
    id: '1-1-0-1', cat: '辅音', sub: '浊辅音', group: '爆破音', ipa: 'd',
    tip: '舌尖抵住上齿龈后爆破，声带振动。',
    words: [
      { w: 'dog', ipa: '/dɒɡ/', zh: '狗', e: '🐶' }, { w: 'day', ipa: '/deɪ/', zh: '天', e: '☀️' },
      { w: 'red', ipa: '/red/', zh: '红色', e: '🔴' }, { w: 'ladder', ipa: '/ˈlædə/', zh: '梯子', e: '🪜' }, { w: 'bed', ipa: '/bed/', zh: '床', e: '🛏️' }
    ]
  },
  {
    id: '1-1-0-2', cat: '辅音', sub: '浊辅音', group: '爆破音', ipa: 'g',
    tip: '舌根抵住软腭后爆破，声带振动。',
    words: [
      { w: 'goat', ipa: '/ɡəʊt/', zh: '山羊', e: '🐐' }, { w: 'girl', ipa: '/ɡɜːl/', zh: '女孩', e: '👧' },
      { w: 'bag', ipa: '/bæɡ/', zh: '包', e: '👜' }, { w: 'tiger', ipa: '/ˈtaɪɡə/', zh: '老虎', e: '🐯' }, { w: 'big', ipa: '/bɪɡ/', zh: '大的', e: '🐘' }
    ]
  },
  {
    id: '1-1-1-0', cat: '辅音', sub: '浊辅音', group: '摩擦音', ipa: 'v',
    tip: '上齿轻咬下唇，摩擦并振动声带。',
    words: [
      { w: 'van', ipa: '/væn/', zh: '面包车', e: '🚐' }, { w: 'five', ipa: '/faɪv/', zh: '五', e: '5️⃣' },
      { w: 'love', ipa: '/lʌv/', zh: '爱', e: '❤️' }, { w: 'seven', ipa: '/ˈsevn/', zh: '七', e: '7️⃣' }, { w: 'very', ipa: '/ˈveri/', zh: '非常', e: '✨' }
    ]
  },
  {
    id: '1-1-1-1', cat: '辅音', sub: '浊辅音', group: '摩擦音', ipa: 'z',
    tip: '舌尖靠近上齿龈，摩擦并振动声带。',
    words: [
      { w: 'zoo', ipa: '/zuː/', zh: '动物园', e: '🦁' }, { w: 'zero', ipa: '/ˈzɪərəʊ/', zh: '零', e: '0️⃣' },
      { w: 'nose', ipa: '/nəʊz/', zh: '鼻子', e: '👃' }, { w: 'music', ipa: '/ˈmjuːzɪk/', zh: '音乐', e: '🎵' }, { w: 'easy', ipa: '/ˈiːzi/', zh: '容易的', e: '😌' }
    ]
  },
  {
    id: '1-1-1-2', cat: '辅音', sub: '浊辅音', group: '摩擦音', ipa: 'ʒ',
    tip: '舌位同 ʃ，但要振动声带，像轻声的“日”。',
    words: [
      { w: 'measure', ipa: '/ˈmeʒə/', zh: '测量', e: '📏' }, { w: 'vision', ipa: '/ˈvɪʒn/', zh: '视力', e: '👓' },
      { w: 'usually', ipa: '/ˈjuːʒuəli/', zh: '通常', e: '🔁' }, { w: 'garage', ipa: '/ˈɡærɑːʒ/', zh: '车库', e: '🚗' }, { w: 'pleasure', ipa: '/ˈpleʒə/', zh: '快乐', e: '😊' }
    ]
  },
  {
    id: '1-1-1-3', cat: '辅音', sub: '浊辅音', group: '摩擦音', ipa: 'ð',
    tip: '舌尖放在上下齿之间，摩擦并振动声带。',
    words: [
      { w: 'this', ipa: '/ðɪs/', zh: '这个', e: '👉' }, { w: 'that', ipa: '/ðæt/', zh: '那个', e: '👈' },
      { w: 'mother', ipa: '/ˈmʌðə/', zh: '妈妈', e: '👩' }, { w: 'brother', ipa: '/ˈbrʌðə/', zh: '哥哥', e: '👦' }, { w: 'weather', ipa: '/ˈweðə/', zh: '天气', e: '🌤️' }
    ]
  },
  {
    id: '1-1-1-4', cat: '辅音', sub: '浊辅音', group: '摩擦音', ipa: 'r',
    tip: '舌尖卷起但不碰上颚，声带振动；美式发音卷舌明显。',
    words: [
      { w: 'red', ipa: '/red/', zh: '红色', e: '🔴' }, { w: 'rabbit', ipa: '/ˈræbɪt/', zh: '兔子', e: '🐰' },
      { w: 'car', ipa: '/kɑː/', zh: '汽车', e: '🚗' }, { w: 'very', ipa: '/ˈveri/', zh: '非常', e: '✨' }, { w: 'run', ipa: '/rʌn/', zh: '跑', e: '🏃' }
    ]
  },
  {
    id: '1-1-2-0', cat: '辅音', sub: '浊辅音', group: '破擦音', ipa: 'dʒ',
    tip: '舌位同 tʃ，但要振动声带，像“知”。',
    words: [
      { w: 'juice', ipa: '/dʒuːs/', zh: '果汁', e: '🧃' }, { w: 'jam', ipa: '/dʒæm/', zh: '果酱', e: '🍓' },
      { w: 'bridge', ipa: '/brɪdʒ/', zh: '桥', e: '🌉' }, { w: 'orange', ipa: '/ˈɒrɪndʒ/', zh: '橙子', e: '🍊' }, { w: 'judge', ipa: '/dʒʌdʒ/', zh: '裁判', e: '👨‍⚖️' }
    ]
  },
  {
    id: '1-1-2-1', cat: '辅音', sub: '浊辅音', group: '破擦音', ipa: 'dr',
    tip: 'd 与 r 快速连读，像“桌”，声带振动。',
    words: [
      { w: 'dress', ipa: '/dres/', zh: '连衣裙', e: '👗' }, { w: 'dream', ipa: '/driːm/', zh: '梦', e: '💭' },
      { w: 'children', ipa: '/ˈtʃɪldrən/', zh: '孩子们', e: '🧒' }, { w: 'hundred', ipa: '/ˈhʌndrəd/', zh: '一百', e: '💯' }, { w: 'drive', ipa: '/draɪv/', zh: '驾驶', e: '🚗' }
    ]
  },
  {
    id: '1-1-2-2', cat: '辅音', sub: '浊辅音', group: '破擦音', ipa: 'dz',
    tip: 'd 与 z 快速连读，像“资”，声带振动。',
    words: [
      { w: 'beds', ipa: '/bedz/', zh: '床（复数）', e: '🛏️' }, { w: 'hands', ipa: '/hændz/', zh: '手（复数）', e: '✋' },
      { w: 'friends', ipa: '/frendz/', zh: '朋友', e: '👫' }, { w: 'words', ipa: '/wɜːdz/', zh: '单词', e: '📝' }, { w: 'needs', ipa: '/niːdz/', zh: '需要', e: '✅' }
    ]
  },
  {
    id: '1-1-3-0', cat: '辅音', sub: '浊辅音', group: '鼻音', ipa: 'm',
    tip: '双唇闭合，气流从鼻腔出来，声带振动。',
    words: [
      { w: 'monkey', ipa: '/ˈmʌŋki/', zh: '猴子', e: '🐒' }, { w: 'map', ipa: '/mæp/', zh: '地图', e: '🗺️' },
      { w: 'mum', ipa: '/mʌm/', zh: '妈妈', e: '👩' }, { w: 'lemon', ipa: '/ˈlemən/', zh: '柠檬', e: '🍋' }, { w: 'room', ipa: '/ruːm/', zh: '房间', e: '🚪' }
    ]
  },
  {
    id: '1-1-3-1', cat: '辅音', sub: '浊辅音', group: '鼻音', ipa: 'n',
    tip: '舌尖抵住上齿龈，气流从鼻腔出来，声带振动。',
    words: [
      { w: 'nose', ipa: '/nəʊz/', zh: '鼻子', e: '👃' }, { w: 'nest', ipa: '/nest/', zh: '鸟巢', e: '🪹' },
      { w: 'ten', ipa: '/ten/', zh: '十', e: '🔟' }, { w: 'sunny', ipa: '/ˈsʌni/', zh: '晴朗的', e: '☀️' }, { w: 'pen', ipa: '/pen/', zh: '钢笔', e: '🖊️' }
    ]
  },
  {
    id: '1-1-3-2', cat: '辅音', sub: '浊辅音', group: '鼻音', ipa: 'ŋ',
    tip: '舌根抵住软腭，气流从鼻腔出来，后鼻音“嗯”。',
    words: [
      { w: 'sing', ipa: '/sɪŋ/', zh: '唱歌', e: '🎤' }, { w: 'king', ipa: '/kɪŋ/', zh: '国王', e: '👑' },
      { w: 'long', ipa: '/lɒŋ/', zh: '长的', e: '📏' }, { w: 'morning', ipa: '/ˈmɔːnɪŋ/', zh: '早晨', e: '🌅' }, { w: 'spring', ipa: '/sprɪŋ/', zh: '春天', e: '🌱' }
    ]
  },
  {
    id: '1-1-4-0', cat: '辅音', sub: '浊辅音', group: '舌侧音', ipa: 'l',
    tip: '舌尖抵住上齿龈，气流从舌头两侧流出，声带振动。',
    words: [
      { w: 'lion', ipa: '/ˈlaɪən/', zh: '狮子', e: '🦁' }, { w: 'leg', ipa: '/leɡ/', zh: '腿', e: '🦵' },
      { w: 'milk', ipa: '/mɪlk/', zh: '牛奶', e: '🥛' }, { w: 'yellow', ipa: '/ˈjeləʊ/', zh: '黄色', e: '💛' }, { w: 'ball', ipa: '/bɔːl/', zh: '球', e: '⚽' }
    ]
  },
  {
    id: '1-1-5-0', cat: '辅音', sub: '浊辅音', group: '半元音', ipa: 'j',
    tip: '舌前部抬高，快速滑向后面的元音，像“耶”。',
    words: [
      { w: 'yes', ipa: '/jes/', zh: '是', e: '✅' }, { w: 'yellow', ipa: '/ˈjeləʊ/', zh: '黄色', e: '💛' },
      { w: 'you', ipa: '/juː/', zh: '你', e: '🫵' }, { w: 'toy', ipa: '/tɔɪ/', zh: '玩具', e: '🧸' }, { w: 'music', ipa: '/ˈmjuːzɪk/', zh: '音乐', e: '🎵' }
    ]
  },
  {
    id: '1-1-5-1', cat: '辅音', sub: '浊辅音', group: '半元音', ipa: 'w',
    tip: '双唇收圆，快速滑向后面的元音，像“乌”。',
    words: [
      { w: 'water', ipa: '/ˈwɔːtə/', zh: '水', e: '💧' }, { w: 'window', ipa: '/ˈwɪndəʊ/', zh: '窗户', e: '🪟' },
      { w: 'we', ipa: '/wiː/', zh: '我们', e: '👥' }, { w: 'swim', ipa: '/swɪm/', zh: '游泳', e: '🏊' }, { w: 'one', ipa: '/wʌn/', zh: '一', e: '1️⃣' }
    ]
  }
];
