import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import SiteHeader from '../../components/public/SiteHeader';
import SiteFooter from '../../components/public/SiteFooter';
import { SEASONS, featuredMoments } from '../../data/seasons';
import { pickUpcomingEvent } from './upcomingEvent';
import AnnouncementBar from './AnnouncementBar';
import HeroCarousel from './HeroCarousel';
import UpcomingSeason from './UpcomingSeason';
import PastSeasons from './PastSeasons';
import MomentsGallery from './MomentsGallery';
import HallOfFame from './HallOfFame';
import ForYou from './ForYou';
import './Home.css';

const HomePage = () => {
  // undefined while loading, null when no event is scheduled.
  const [upcoming, setUpcoming] = useState(undefined);
  const { hash } = useLocation();
  const momentsSeason = featuredMoments();

  useEffect(() => {
    let cancelled = false;
    // Public endpoint: the event list only, never account data.
    apiClient.get('/api/v1/events')
      .then((res) => {
        const data = res.data?.data ?? res.data;
        if (!cancelled) setUpcoming(pickUpcomingEvent(Array.isArray(data) ? data : []));
      })
      .catch(() => {
        // Backend unreachable: fall back to the "next season soon" block.
        if (!cancelled) setUpcoming(null);
      });
    return () => { cancelled = true; };
  }, []);

  // The header links to "/#section"; bring that section into view, including on
  // arrival from another page.
  useEffect(() => {
    if (!hash) return;
    document.getElementById(hash.slice(1))?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  }, [hash]);

  return (
    <div className="pub">
      <AnnouncementBar event={upcoming} />
      <SiteHeader />
      <main>
        <HeroCarousel seasons={SEASONS} photosSeasonSlug={momentsSeason?.slug} />
        <UpcomingSeason event={upcoming} />
        <PastSeasons seasons={SEASONS} />
        <MomentsGallery season={momentsSeason} />
        <HallOfFame seasons={SEASONS} />
        <ForYou />
      </main>
      <SiteFooter />
    </div>
  );
};

export default HomePage;
