import React from 'react';

import classes from './Loader.module.css'
import loaderGif from '../../assets/loader-transparent.gif'

// only show loader when loading takes longer than x ms
const LOADER_SHOW_DELAY = 500

export function Loader() {
  const [shouldShow, setShouldShow] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShouldShow(true);
    }, LOADER_SHOW_DELAY);
    return () => clearTimeout(timer);
  }, []);

  if (!shouldShow) return null

  return (
    <div className={classes.loader}>
      <img src={loaderGif} alt="loading..." />
    </div>
  )
}