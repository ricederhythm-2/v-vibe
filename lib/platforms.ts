export interface Platform {
  id: string;
  label: string;
  color: string;
  bg: string;       // background for badge
  placeholder: string;
}

export const PLATFORMS: Platform[] = [
  { id: 'youtube',     label: 'YouTube',    color: '#FF0000', bg: '#FF00001A', placeholder: 'https://youtube.com/@yourname' },
  { id: 'twitch',      label: 'Twitch',     color: '#9146FF', bg: '#9146FF1A', placeholder: 'https://twitch.tv/yourname' },
  { id: 'tiktok',      label: 'TikTok',     color: '#010101', bg: '#0101011A', placeholder: 'https://tiktok.com/@yourname' },
  { id: 'niconico',    label: 'ニコニコ',   color: '#6B778D', bg: '#6B778D1A', placeholder: 'https://nicovideo.jp/user/...' },
  { id: 'twitcasting', label: 'ツイキャス', color: '#1F91CC', bg: '#1F91CC1A', placeholder: 'https://twitcasting.tv/yourname' },
  { id: '17live',      label: '17LIVE',     color: '#E8553E', bg: '#E8553E1A', placeholder: 'https://17.live/profile/...' },
  { id: 'iriam',       label: 'IRIAM',      color: '#1B74E4', bg: '#1B74E41A', placeholder: 'https://www.iriam.com/streamer/...' },
  { id: 'reality',     label: 'REALITY',    color: '#5B5BFF', bg: '#5B5BFF1A', placeholder: 'https://reality.app/profile/...' },
  { id: 'mixch',       label: 'ミクチャ',   color: '#FF6B35', bg: '#FF6B351A', placeholder: 'https://mixch.tv/u/...' },
  { id: 'mirrativ',    label: 'Mirrativ',   color: '#00C9A7', bg: '#00C9A71A', placeholder: 'https://mirrativ.com/user/...' },
];
