import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 웹사이트에서 상품 정보를 추출하는 함수
 * @param {string} url - 스크래핑할 웹사이트 URL
 * @param {Object} selectors - CSS 선택자 객체
 * @returns {Promise<Array>} 상품 정보 배열
 */
async function scrapeProducts(url, selectors = {}) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // 기본 선택자 (일반적인 이커머스 사이트 구조)
    const defaultSelectors = {
      productContainer: '.product-item, .product-card, [data-product], .item',
      name: '.product-name, .item-name, h2, h3, [data-name]',
      price: '.price, .product-price, [data-price]',
      image: 'img',
      description: '.description, .product-description, p',
      category: '.category, .product-category',
      link: 'a',
      ...selectors
    };

    const products = await page.evaluate((selectors) => {
      const productElements = document.querySelectorAll(selectors.productContainer);
      const results = [];

      productElements.forEach((element, index) => {
        try {
          const nameEl = element.querySelector(selectors.name);
          const priceEl = element.querySelector(selectors.price);
          const imageEl = element.querySelector(selectors.image);
          const descEl = element.querySelector(selectors.description);
          const categoryEl = element.querySelector(selectors.category);
          const linkEl = element.querySelector(selectors.link);

          if (!nameEl) return;

          const name = nameEl.textContent?.trim() || '';
          const priceText = priceEl?.textContent?.trim() || '';
          // 가격에서 숫자만 추출
          const price = parseInt(priceText.replace(/[^0-9]/g, '')) || 0;
          const image = imageEl?.src || imageEl?.getAttribute('data-src') || '';
          const description = descEl?.textContent?.trim() || '';
          const category = categoryEl?.textContent?.trim() || '';
          const link = linkEl?.href || '';

          if (name) {
            results.push({
              id: `scraped-${index + 1}`,
              name,
              description,
              price,
              image,
              category,
              link,
              scrapedAt: new Date().toISOString()
            });
          }
        } catch (error) {
          console.error(`상품 ${index} 추출 중 오류:`, error);
        }
      });

      return results;
    }, defaultSelectors);

    return products;
  } finally {
    await browser.close();
  }
}

/**
 * 상품 정보를 JSON 파일로 저장
 */
function saveProductsToJson(products, filename = 'product_json.json') {
  const outputPath = path.join(__dirname, '..', filename);
  const jsonData = JSON.stringify(products, null, 2);
  fs.writeFileSync(outputPath, jsonData, 'utf-8');
  console.log(`✅ ${products.length}개의 상품 정보가 ${filename}에 저장되었습니다.`);
}

// 메인 실행 함수
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
사용법: node scripts/scrape-products.js <URL> [옵션]

예시:
  node scripts/scrape-products.js https://example.com/products
  node scripts/scrape-products.js https://example.com/products --output custom-products.json

옵션:
  --output <filename>  출력 파일명 지정 (기본값: product_json.json)
    `);
    process.exit(1);
  }

  const url = args[0];
  const outputIndex = args.indexOf('--output');
  const outputFile = outputIndex !== -1 && args[outputIndex + 1] 
    ? args[outputIndex + 1] 
    : 'product_json.json';

  console.log(`🔍 ${url}에서 상품 정보를 추출하는 중...`);

  try {
    const products = await scrapeProducts(url);
    
    if (products.length === 0) {
      console.log('⚠️  추출된 상품이 없습니다. URL과 선택자를 확인해주세요.');
      console.log('\n💡 커스텀 선택자를 사용하려면 스크립트를 수정하세요.');
    } else {
      saveProductsToJson(products, outputFile);
      console.log('\n📊 추출된 상품 정보:');
      products.forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.name} - ${product.price.toLocaleString()}원`);
      });
    }
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    process.exit(1);
  }
}

// 스크립트가 직접 실행될 때만 main 함수 실행
if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { scrapeProducts, saveProductsToJson };

