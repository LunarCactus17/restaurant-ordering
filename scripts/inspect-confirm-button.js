async function main() {
  const res = await fetch('http://localhost:3000/cart');
  const text = await res.text();
  console.log('HAS_ORDER_PLACED', text.includes('Order placed'));
  const idx = text.indexOf('Back to menu');
  console.log('BACK_TO_MENU_INDEX', idx);
  if (idx >= 0) {
    const start = Math.max(0, idx - 600);
    const end = Math.min(text.length, idx + 200);
    console.log(text.slice(start, end));
  }
}
main().catch((error) => {
  console.error(error);
  process.exit(1);
});
