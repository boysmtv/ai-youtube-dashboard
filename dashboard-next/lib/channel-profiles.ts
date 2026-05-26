export type ChannelBusinessProfile = {
  channel_id: string;
  display_name: string;
  niche_key: string;
  niche_label: string;
  content_style: string;
  hashtag_hints: readonly string[];
  avoid_tags: readonly string[];
  caption_tone: string;
  operator_description: string;
};

export const CHANNEL_BUSINESS_PROFILES: Record<string, ChannelBusinessProfile> = {
  gaming: {
    channel_id: "channel_dsrvgaming",
    display_name: "DSRY Gaming ID",
    niche_key: "gaming",
    niche_label: "Gaming",
    content_style: "gameplay, gaming highlights, funny gaming moments, tips ringan",
    hashtag_hints: ["#Shorts", "#Gaming", "#Gameplay", "#GameShorts"],
    avoid_tags: ["football", "podcast", "hot talk", "unrelated viral facts"],
    caption_tone: "energetic, fast, and playful",
    operator_description: "Konten gaming singkat yang fokus pada clutch, highlight, reaksi lucu, dan tips ringan.",
  },
  hot_talk: {
    channel_id: "channel_hottalk",
    display_name: "Hot Talk ID",
    niche_key: "hot_talk",
    niche_label: "Hot Talk / Cerita Viral",
    content_style: "fakta viral, cerita trending, commentary ringan, obrolan menarik",
    hashtag_hints: ["#Shorts", "#Viral", "#FaktaMenarik", "#CeritaViral", "#HotTalk"],
    avoid_tags: ["football", "gaming", "podcast", "unrelated education tags"],
    caption_tone: "curious, conversational, and punchy",
    operator_description: "Konten komentar ringan yang mengangkat cerita viral, fakta menarik, dan obrolan yang cepat ditangkap penonton.",
  },
  football: {
    channel_id: "channel_epicgoal",
    display_name: "Epic Goal ID",
    niche_key: "football",
    niche_label: "Football / Soccer",
    content_style: "goal, football skills, match moments, football facts, sports shorts",
    hashtag_hints: ["#Shorts", "#Football", "#Sepakbola", "#Goal", "#Soccer", "#FootballSkills"],
    avoid_tags: ["gaming", "podcast", "hot talk", "random facts"],
    caption_tone: "action-oriented and sports-first",
    operator_description: "Konten sepak bola singkat yang menonjolkan goal, skill, momen pertandingan, dan fakta olahraga.",
  },
  shortcast: {
    channel_id: "channel_shortcast",
    display_name: "Short Cast ID",
    niche_key: "shortcast",
    niche_label: "Short Facts / Recap",
    content_style: "fakta singkat, cerita cepat, recap, knowledge shorts",
    hashtag_hints: ["#Shorts", "#FaktaSingkat", "#FaktaUnik", "#EdukasiRingan", "#ShortCast"],
    avoid_tags: ["gaming", "football", "podcast", "hot talk"],
    caption_tone: "clear, concise, and informative",
    operator_description: "Konten fakta singkat atau recap ringan yang mudah dipahami dan tidak terlalu teknis.",
  },
};

const CHANNEL_ID_TO_PROFILE_KEY: Record<string, keyof typeof CHANNEL_BUSINESS_PROFILES> = {
  channel_dsrvgaming: "gaming",
  channel_hottalk: "hot_talk",
  channel_epicgoal: "football",
  channel_shortcast: "shortcast",
};

function normalizeKey(value: string | null | undefined) {
  return String(value || "").trim().toLowerCase();
}

export function getChannelBusinessProfile(channel: { channel_id?: string | null; id?: string | null; niche?: string | null } | string) {
  const channelId = typeof channel === "string" ? channel : channel.channel_id || channel.id || "";
  const niche = typeof channel === "string" ? "" : channel.niche || "";
  const byChannel = CHANNEL_ID_TO_PROFILE_KEY[normalizeKey(channelId)];
  if (byChannel) return CHANNEL_BUSINESS_PROFILES[byChannel];
  const normalizedNiche = normalizeKey(niche);
  if (normalizedNiche === "hot_news" || normalizedNiche === "hot_selebgram" || normalizedNiche === "seleb" || normalizedNiche === "selebgram") {
    return CHANNEL_BUSINESS_PROFILES.hot_talk;
  }
  if (normalizedNiche === "short_cast") return CHANNEL_BUSINESS_PROFILES.shortcast;
  if (normalizedNiche === "game" || normalizedNiche === "gaming") return CHANNEL_BUSINESS_PROFILES.gaming;
  if (normalizedNiche === "football" || normalizedNiche === "goal" || normalizedNiche === "soccer" || normalizedNiche === "bola") {
    return CHANNEL_BUSINESS_PROFILES.football;
  }
  if (normalizedNiche === "shortcast") return CHANNEL_BUSINESS_PROFILES.shortcast;
  return CHANNEL_BUSINESS_PROFILES.football;
}
