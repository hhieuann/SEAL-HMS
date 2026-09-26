// Archive of past SEAL Hackathon seasons shown on the public home page and the season
// recap pages. The backend has no fields for cover photos, themes or winners yet, so
// this record is kept by hand; add a season at the top of SEASONS when it ends.
//
// Sources: the organisers' Spring 2026 information sheet and the Summer 2026 posts on
// the FPT University HCMC Facebook page (15–16/08/2026).
// Unknown facts stay null and the pages show "đang cập nhật" instead of inventing them.

import campusCourtyard from '../assets/FptBackground.jpg';
import campusTerrace from '../assets/fpt_bg_new.jpg';
import su26FinalsWide from '../assets/seasons/su26/chungket-toancanh.jpg';
import su26FinalsStage from '../assets/seasons/su26/chungket-sankhau.jpg';
import su26Pitch from '../assets/seasons/su26/chungket-thuyettrinh.jpg';
import su26FinalsPresenting from '../assets/seasons/su26/chungket-trinhbay.jpg';
import su26FinalsFloor from '../assets/seasons/su26/chungket-giamkhao.jpg';
import su26OpeningWide from '../assets/seasons/su26/khaimac-toancanh.jpg';
import su26CheckIn from '../assets/seasons/su26/khaimac-checkin.jpg';
import su26Arena from '../assets/seasons/su26/khaimac-khuvucthi.jpg';
import su26Teams from '../assets/seasons/su26/khaimac-doithi.jpg';
import su26ClosingStage from '../assets/seasons/su26/bemac-sankhau.jpg';
import su26ClosingWide from '../assets/seasons/su26/bemac-toancanh.jpg';

// Competition format and prize money from the Spring 2026 sheet. Summer 2026 ran on the
// same format; its own prize list was not published, so it reuses this one.
const SEAL_FORMAT = [
  {
    vi: 'Mỗi đội 3–5 thành viên, bốc thăm chia track vào ngày khai mạc.',
    en: 'Teams of 3–5 members; tracks are drawn on opening day.',
  },
  {
    vi: 'Mỗi track là một bảng, tối đa 8 đội. Ban tổ chức chia bảng ngẫu nhiên và công bằng.',
    en: 'Each track is one group of up to 8 teams, drawn fairly at random.',
  },
  {
    vi: 'Vòng sơ loại: code trong 7 tiếng theo đề của Ban tổ chức, sau đó thuyết trình theo bảng.',
    en: "Qualifying round: 7 hours of coding on the organisers' brief, then pitching within the group.",
  },
  {
    vi: 'Top 2 mỗi bảng vào chung kết, tổng cộng 6 đội.',
    en: 'The top 2 of each group advance, 6 finalists in total.',
  },
  {
    vi: 'Vòng chung kết: thuyết trình sản phẩm, Ban giám khảo chọn 4 đội đạt giải.',
    en: 'Finals: product pitches, after which the judges pick 4 prize-winning teams.',
  },
];

const SEAL_PRIZES = [
  { key: 'first', amount: 7000000 },
  { key: 'second', amount: 5000000 },
  { key: 'third', amount: 3000000 },
  { key: 'creative', amount: 1500000 },
];

const VENUE_FPTU_HCM = { vi: 'Trường Đại học FPT TP.HCM', en: 'FPT University HCMC' };

export const SEASONS = [
  {
    slug: 'summer-2026',
    code: 'SU26',
    number: 3,
    name: 'Summer 2026',
    year: 2026,
    startDate: '2026-08-15',
    endDate: '2026-08-16',
    venue: VENUE_FPTU_HCM,
    theme: 'AI-Driven Smart Operations: Turning Real-Time IoT Data into Intelligent Action',
    summary: {
      vi: 'Mùa thứ ba của SEAL – Software Engineering Agile League, sau Fall 2025 và Spring 2026. Các đội xây dựng giải pháp AI xử lý dữ liệu IoT thời gian thực. Ngoài giải thưởng tại kỳ, mùa này còn vinh danh những thí sinh đồng hành xuyên suốt cả 3 mùa.',
      en: 'The third season of SEAL – Software Engineering Agile League, after Fall 2025 and Spring 2026. Teams built AI solutions that act on real-time IoT data. Besides the season prizes, it honoured the contestants who took part in all three seasons.',
    },
    stats: { teams: null, finalists: 6, prizes: 4, teamSize: '3–5' },
    finalists: ['Open to work', 'CharIOT', 'Ae Miền Trung', 'VETERAN', 'KHTN', 'Bridge'],
    // { first|second|third|creative: { team, project, track } } once the results are published.
    winners: null,
    cover: {
      src: su26FinalsWide,
      position: '50% 28%',
      alt: {
        vi: 'Toàn cảnh vòng chung kết SEAL Hackathon Summer 2026',
        en: 'The SEAL Hackathon Summer 2026 finals',
      },
    },
    card: {
      src: su26Pitch,
      alt: {
        vi: 'Một đội thuyết trình tại vòng chung kết SEAL Hackathon Summer 2026',
        en: 'A team pitching at the SEAL Hackathon Summer 2026 finals',
      },
    },
    banner: {
      src: su26FinalsStage,
      alt: {
        vi: 'Sân khấu vòng chung kết SEAL Hackathon Summer 2026',
        en: 'The SEAL Hackathon Summer 2026 finals stage',
      },
    },
    schedule: [
      {
        date: '2026-08-15',
        time: '14:00',
        title: { vi: 'Khai mạc & bốc bảng', en: 'Opening & group draw' },
        desc: {
          vi: 'Chia track, nhận thông tin thử thách, test máy và làm quen không gian thi đấu.',
          en: 'Track draw, challenge briefing, machine checks and a first look at the arena.',
        },
      },
      {
        date: '2026-08-16',
        time: '07:00',
        title: { vi: 'Vòng sơ loại', en: 'Qualifying round' },
        desc: {
          vi: 'Các đội code 7 tiếng theo đề của Ban tổ chức, sau đó thuyết trình theo bảng.',
          en: "Teams code for 7 hours on the organisers' brief, then pitch within their group.",
        },
      },
      {
        date: '2026-08-16',
        title: { vi: 'Vòng chung kết', en: 'Finals' },
        desc: {
          vi: '6 đội xuất sắc nhất bảo vệ giải pháp trước Ban giám khảo.',
          en: 'The top 6 teams defend their solutions before the judging panel.',
        },
      },
      {
        date: '2026-08-16',
        title: { vi: 'Bế mạc & trao giải', en: 'Closing & awards' },
        desc: {
          vi: 'Công bố kết quả chung cuộc và vinh danh thí sinh đồng hành cả 3 mùa.',
          en: 'Final results are announced and three-season contestants are honoured.',
        },
      },
    ],
    format: SEAL_FORMAT,
    prizes: SEAL_PRIZES,
    criteria: null,
    momentsIntro: {
      vi: 'Hai ngày 15–16/08/2026 tại Trường Đại học FPT TP.HCM: từ bốc bảng, test máy đến sân khấu chung kết.',
      en: 'Two days, 15–16 August 2026, at FPT University HCMC: from the group draw and machine checks to the finals stage.',
    },
    moments: [
      { src: su26OpeningWide, caption: { vi: 'Khai mạc · 15/08/2026', en: 'Opening · 15 Aug 2026' } },
      { src: su26CheckIn, caption: { vi: 'Check-in ngày khai mạc', en: 'Opening-day check-in' } },
      { src: su26Arena, caption: { vi: 'Làm quen khu vực thi đấu', en: 'Getting to know the arena' } },
      { src: su26FinalsPresenting, caption: { vi: 'Vòng chung kết · 16/08/2026', en: 'Finals · 16 Aug 2026' } },
      { src: su26ClosingStage, caption: { vi: 'Bế mạc & công bố kết quả', en: 'Closing & results' } },
    ],
    gallery: [
      { src: su26Teams, caption: { vi: 'Ngày khai mạc · 15/08', en: 'Opening day · 15 Aug' } },
      { src: su26FinalsFloor, caption: { vi: 'Vòng chung kết · 16/08', en: 'Finals · 16 Aug' } },
      { src: su26ClosingWide, caption: { vi: 'Bế mạc · 16/08', en: 'Closing · 16 Aug' } },
    ],
  },
  {
    slug: 'spring-2026',
    code: 'SP26',
    number: 2,
    name: 'Spring 2026',
    year: 2026,
    startDate: '2026-04-11',
    endDate: '2026-04-12',
    venue: null,
    theme: 'Mastering Domain-Specific AI RAG Systems',
    summary: {
      vi: 'Mùa thứ hai của SEAL – Software Engineering Agile League, sau mùa đầu tiên Fall 2025. Các đội xây dựng và tối ưu hệ thống AI RAG (Retrieval-Augmented Generation) trên bộ dữ liệu chuyên biệt do chính đội lựa chọn, rèn tư duy về độ chính xác và độ tin cậy của thông tin.',
      en: 'The second season of SEAL – Software Engineering Agile League, after the first season in Fall 2025. Teams built and tuned AI RAG (Retrieval-Augmented Generation) systems on domain-specific datasets of their own choosing, with a focus on accurate, trustworthy answers.',
    },
    stats: { teams: null, finalists: 6, prizes: 4, teamSize: '3–5' },
    finalists: null,
    winners: null,
    // No Spring photos yet: a campus shot stands in until the organisers share some.
    cover: { src: campusCourtyard, position: '50% 50%', placeholder: true },
    card: { src: campusCourtyard, placeholder: true },
    banner: { src: campusCourtyard, placeholder: true },
    schedule: [
      {
        date: '2026-04-09',
        time: '20:00',
        title: { vi: 'Workshop online', en: 'Online workshop' },
        desc: {
          vi: '“The RAG Revolution: Transforming Complex Data into Actionable Domain Insights”.',
          en: '“The RAG Revolution: Transforming Complex Data into Actionable Domain Insights”.',
        },
      },
      {
        date: '2026-04-11',
        time: '14:00',
        title: { vi: 'Khai mạc & chia track', en: 'Opening & track draw' },
        desc: {
          vi: 'Khai mạc, bốc thăm chủ đề, chia bảng thi đấu và gặp gỡ các đội.',
          en: 'Opening, topic draw, group split and a meet-up of all teams.',
        },
      },
      {
        date: '2026-04-12',
        time: '07:00',
        title: { vi: 'Vòng sơ loại', en: 'Qualifying round' },
        desc: {
          vi: 'Các đội code 7 tiếng theo đề của Ban tổ chức, sau đó thuyết trình theo bảng.',
          en: "Teams code for 7 hours on the organisers' brief, then pitch within their group.",
        },
      },
      {
        date: '2026-04-12',
        title: { vi: 'Chung kết, bế mạc & trao giải', en: 'Finals, closing & awards' },
        desc: {
          vi: '6 đội vào chung kết, Ban giám khảo chọn 4 đội đạt giải.',
          en: 'Six finalists pitch and the judges pick four winners.',
        },
      },
    ],
    format: SEAL_FORMAT,
    prizes: SEAL_PRIZES,
    criteria: {
      prelim: [
        { weight: 30, label: { vi: 'Tính chính xác và sự phù hợp với Domain', en: 'Accuracy and domain fit' } },
        { weight: 30, label: { vi: 'Kiến trúc Agentic RAG & giải thuật', en: 'Agentic RAG architecture & algorithms' } },
        { weight: 15, label: { vi: 'Ý tưởng & thuyết trình', en: 'Idea & pitch' } },
        { weight: 15, label: { vi: 'Khả năng thực thi & tính sáng tạo', en: 'Execution & creativity' } },
        { weight: 10, label: { vi: 'Trải nghiệm người dùng & giao diện tương tác', en: 'User experience & interface' } },
      ],
      final: [
        { weight: 30, label: { vi: 'Chất lượng xử lý & truy xuất dữ liệu', en: 'Data processing & retrieval quality' } },
        { weight: 20, label: { vi: 'Độ tin cậy & chống ảo giác', en: 'Reliability & hallucination resistance' } },
        { weight: 20, label: { vi: 'Tư duy Agent & xử lý đa tầng', en: 'Agent reasoning & multi-step handling' } },
        { weight: 20, label: { vi: 'Tính thực tế & tối ưu vận hành', en: 'Practicality & operational efficiency' } },
        { weight: 10, label: { vi: 'Khả năng mở rộng & sáng tạo', en: 'Scalability & creativity' } },
      ],
    },
    moments: null,
    gallery: null,
  },
  {
    slug: 'fall-2025',
    code: 'FA25',
    number: 1,
    name: 'Fall 2025',
    year: 2025,
    startDate: null,
    endDate: null,
    venue: null,
    theme: null,
    summary: {
      vi: 'Mùa đầu tiên của SEAL – Software Engineering Agile League, mở đầu hệ thống 3 hackathon mỗi năm theo các học kỳ Spring, Summer và Fall.',
      en: 'The first season of SEAL – Software Engineering Agile League, launching a series of three hackathons a year across the Spring, Summer and Fall semesters.',
    },
    stats: { teams: null, finalists: null, prizes: null, teamSize: null },
    finalists: null,
    winners: null,
    cover: { src: campusTerrace, position: '50% 50%', placeholder: true },
    card: { src: campusTerrace, placeholder: true },
    banner: { src: campusTerrace, placeholder: true },
    schedule: null,
    format: null,
    prizes: null,
    criteria: null,
    moments: null,
    gallery: null,
  },
];

export const findSeason = (slug) => SEASONS.find((season) => season.slug === slug) || null;

// The newest season that has a photo set, for the home page gallery.
export const featuredMoments = () => SEASONS.find((season) => season.moments?.length) || null;
