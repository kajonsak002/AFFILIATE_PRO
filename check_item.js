(() => {
  const item = document.querySelector('[role="menuitem"]');
  return {
    tag: item ? item.tagName : null,
    html: item ? item.outerHTML : null
  };
})()
