# Keyword Scrapazon  

This is a humble amazon-india product scraper that captures a few data points of amazon products.  
The scraper runs using supplied **keywords** in the *config* file and writes the captured data to a *'csv'* file.  
Data captured is very *raw* in the sense that no product listing has been ignored  
 e.g. a book/sponsored/not-rated product.

 >**Motivation:** Although keyword scraper picks up a lot of unnecessary data, there is none I could find currently that do it this way.  
 (The ones I found are url/asin based. correct me if I'm wrong.) also, a lot of edge cases have not been covered; hence this scraper.  
 There can always be a filter at a later stage like excel.

<br>  
<br>  

## DEV  

#### 1. **Folder Structure**
  - The entry point is at the project root *'index.js'* file.
  - *'utils/'*
    - the utils/ folder has all the functions required for the scraper to run
    - **config.js** file has the *keywords* and *page_count*(denotes the number  
    of search result pages to scrape for)  
    - **selectors.js** has the css-selectors for their respective data-points to  
    scrape.  

<br>  

#### 2. **Dependencies**
  - puppeteer
  - fast-csv  

<br>  

#### 3. **Data Model**  
<br>  

```
dataObject: {
  name: String,
  sponsored: Boolean,
  url: String,
  reviewCount: Number,
  merchant: String,
  brand: String,
  rating: Number,
  isBook: Boolean,
}
```
The products array is as follows:<br>
```arr[arr[{dataObject}]]```
