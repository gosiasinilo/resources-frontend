import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faBriefcase, faUserGroup, faUserPlus, faUserMinus,
  faCircleCheck, faPen, faTrash, faPlus, faScrewdriverWrench,
  faLocationDot, faGlobe, faMagnifyingGlass, faCalendar,
  faStar, faChevronDown, faChevronUp, faChevronLeft, faXmark,
  faClock, faCheck, faUser, faCircleInfo, faArrowRight,
  faEye, faEyeSlash, faWandMagicSparkles, faCircleNotch,
} from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarRegular } from '@fortawesome/free-regular-svg-icons';

library.add(
  faBriefcase, faUserGroup, faUserPlus, faUserMinus,
  faCircleCheck, faPen, faTrash, faPlus, faScrewdriverWrench,
  faLocationDot, faGlobe, faMagnifyingGlass, faCalendar,
  faStar, faStarRegular, faChevronDown, faChevronUp, faChevronLeft, faXmark,
  faClock, faCheck, faUser, faCircleInfo, faArrowRight,
  faEye, faEyeSlash, faWandMagicSparkles, faCircleNotch,
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
