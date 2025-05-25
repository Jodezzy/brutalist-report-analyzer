import requests
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
import json
import argparse
import os
import sys
import time
import re
from collections import Counter
from urllib.parse import urljoin, urlparse


class BrutalistReportScraper:
    """
    Enhanced scraper for brutalist.report with support for:
    - Today or last week scraping
    - Topic filtering
    - Progress tracking
    - Grouped results by similarity
    - Sorting by group size
    """

    AVAILABLE_TOPICS = [
        "tech",
        "news",
        "business",
        "science",
        "gaming",
        "culture",
        "politics",
        "sports",
    ]

    def __init__(self):
        self.base_url = "https://brutalist.report"
        self.progress_bar = None
        # Adjusted similarity thresholds to be more balanced between topic and general
        self.similarity_thresholds = {
            "topic": 4,  # Topic-specific content needs 4 common words
            "general": 4,  # General content also needs 4 common words
            "topic_last_week": 5,  # Topic content from last week needs 5 common words
            "general_last_week": 6,  # General content from last week needs 6 common words
        }
        # Minimum number of articles required to form a group
        self.min_group_size = 5

    def create_url(self, topic=None, before_date=None):
        """Constructs URL based on topic and date parameters"""
        url = self.base_url

        # Add topic path if provided
        if topic and topic in self.AVAILABLE_TOPICS:
            url += f"/topic/{topic}"

        # Add before parameter if provided
        if before_date:
            url += f"?before={before_date}"

        return url

    def scrape_page(self, url):
        """Scrapes a single brutalist.report page"""
        self.update_progress("Fetching URL: " + url)
        try:
            response = requests.get(url)
            response.raise_for_status()
        except requests.RequestException as e:
            self.update_progress(f"Error fetching {url}: {e}")
            return None

        # Parse the HTML
        soup = BeautifulSoup(response.text, "html.parser")

        # Find the brutal-grid div that contains news sections
        brutal_grid = soup.find("div", class_="brutal-grid")
        if not brutal_grid:
            self.update_progress(f"No news grid found on {url}")
            return None

        # Dictionary to store results
        news_data = {"url": url, "sources": {}}

        # Process each news source div within the grid
        for div in brutal_grid.find_all("div", recursive=False):
            # Get the source name from the h3 tag
            h3 = div.find("h3")
            if not h3 or not h3.find("a"):
                continue

            source_name = h3.find("a").text.strip()

            # Get all headlines in this source's list
            headlines = []
            ul = div.find("ul")
            if not ul:
                continue

            for li in ul.find_all("li"):
                # Get the main headline link
                headline_link = li.find("a")
                if not headline_link:
                    continue

                headline_url = headline_link.get("href", "")
                headline_text = headline_link.text.strip()

                # Get time if available (in the format [1h])
                time_text = None
                for text in li.stripped_strings:
                    if "[" in text and "]" in text and "h]" in text:
                        time_text = text.strip()
                        break

                # Get the source-specific link (like [hn])
                source_specific_link = None
                links = li.find_all("a")
                if len(links) > 1:
                    last_link = links[-1]
                    if last_link.text.strip().startswith(
                        "["
                    ) and last_link.text.strip().endswith("]"):
                        source_specific_link = {
                            "text": last_link.text.strip(),
                            "url": last_link.get("href", ""),
                        }

                headlines.append(
                    {
                        "title": headline_text,
                        "url": headline_url,
                        "time": time_text,
                        "source_link": source_specific_link,
                    }
                )

            # Add this source to our news data
            if headlines:
                news_data["sources"][source_name] = headlines

        return news_data

    def scrape_today(self, topic=None):
        """Scrapes today's headlines, optionally filtered by topic"""
        url = self.create_url(topic)
        self.update_progress(
            json.dumps(
                {
                    "status": "progress",
                    "message": f"Scraping today's content{f' for {topic}' if topic else ''}...",
                    "processed": 0,
                    "total": 0,
                }
            )
        )
        return self.scrape_page(url)

    def scrape_last_week(self, topic=None):
        """Scrapes headlines from the past week, optionally filtered by topic"""
        # Generate dates for the past week
        current_date = datetime.now().date()
        dates = []
        for i in range(2, 9):  # 2 to 8 inclusive (7 days)
            date = current_date - timedelta(days=i)
            dates.append(date.strftime("%Y-%m-%d"))

        # Scrape data for each date
        aggregated_data = {
            "date_range": f"{dates[-1]} to {dates[0]}",  # Oldest to newest
            "sources": {},
        }

        self.update_progress(
            json.dumps(
                {
                    "status": "progress",
                    "message": f"Scraping past week ({aggregated_data['date_range']}){f' for {topic}' if topic else ''}...",
                    "processed": 0,
                    "total": len(dates),
                }
            )
        )

        for i, before_date in enumerate(dates, 1):
            url = self.create_url(topic, before_date)
            news_data = self.scrape_page(url)

            if news_data and news_data.get("sources"):
                for source, headlines in news_data["sources"].items():
                    if source not in aggregated_data["sources"]:
                        aggregated_data["sources"][source] = []
                    aggregated_data["sources"][source].extend(headlines)

            # Update progress
            self.update_progress(
                json.dumps(
                    {
                        "status": "progress",
                        "message": f"Processing date {before_date}...",
                        "processed": i,
                        "total": len(dates),
                    }
                )
            )

        return aggregated_data

    # =====================================================================
    # EXPERIMENTAL FEATURE: Article Image Extraction
    # Improved version with better efficiency and reliability
    # =====================================================================
    def extract_article_image(self, article_url, max_retries=2):
        """
        Extract the main image from a news article.
        Improved version with better meta tag handling and faster processing.
        """
        try:
            # Simplified headers - many sites block overly complex user agents
            headers = {
                'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)',
                'Accept': 'text/html,application/xhtml+xml',
                'Accept-Language': 'en-US,en;q=0.5',
            }
            
            response = requests.get(article_url, headers=headers, timeout=8)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Strategy 1: Meta tags (most reliable for news sites)
            # Open Graph image - highest priority
            og_image = soup.find('meta', property='og:image')
            if og_image and og_image.get('content'):
                img_url = og_image['content']
                if self._is_valid_image_url(img_url):
                    # Safely get alt text
                    og_title = soup.find('meta', property='og:title')
                    alt_text = og_title.get('content', 'Article image') if og_title else 'Article image'
                    return {
                        'url': urljoin(article_url, img_url),
                        'alt': alt_text[:100],
                        'source_url': article_url
                    }
            
            # Twitter Card image - second priority
            twitter_image = soup.find('meta', attrs={'name': 'twitter:image'}) or soup.find('meta', attrs={'property': 'twitter:image'})
            if twitter_image and twitter_image.get('content'):
                img_url = twitter_image['content']
                if self._is_valid_image_url(img_url):
                    # Safely get alt text
                    twitter_title = soup.find('meta', attrs={'name': 'twitter:title'})
                    alt_text = twitter_title.get('content', 'Article image') if twitter_title else 'Article image'
                    return {
                        'url': urljoin(article_url, img_url),
                        'alt': alt_text[:100],
                        'source_url': article_url
                    }
            
            # Strategy 2: Structured data (JSON-LD)
            json_ld_scripts = soup.find_all('script', type='application/ld+json')
            for script in json_ld_scripts:
                try:
                    data = json.loads(script.string)
                    if isinstance(data, list):
                        data = data[0]
                    
                    # Look for image in various JSON-LD structures
                    image_url = None
                    if isinstance(data, dict):
                        if 'image' in data:
                            if isinstance(data['image'], str):
                                image_url = data['image']
                            elif isinstance(data['image'], dict) and 'url' in data['image']:
                                image_url = data['image']['url']
                            elif isinstance(data['image'], list) and len(data['image']) > 0:
                                if isinstance(data['image'][0], str):
                                    image_url = data['image'][0]
                                elif isinstance(data['image'][0], dict) and 'url' in data['image'][0]:
                                    image_url = data['image'][0]['url']
                    
                    if image_url and self._is_valid_image_url(image_url):
                        return {
                            'url': urljoin(article_url, image_url),
                            'alt': data.get('headline', data.get('name', 'Article image'))[:100],
                            'source_url': article_url
                        }
                except (json.JSONDecodeError, TypeError, KeyError):
                    continue
            
            # Strategy 3: Common news site selectors (faster than broad search)
            priority_selectors = [
                'article img[src]:first-of-type',
                '.article-image img',
                '.hero-image img',
                '.featured-image img',
                '.post-thumbnail img',
                '.entry-image img',
                'figure img',
                '.content img:first-of-type'
            ]
            
            for selector in priority_selectors:
                img = soup.select_one(selector)
                if img:
                    src = img.get('src') or img.get('data-src') or img.get('data-lazy-src')
                    alt = img.get('alt', '').strip()
                    
                    if src and self._is_valid_image_url(src) and len(alt) > 3:
                        return {
                            'url': urljoin(article_url, src),
                            'alt': alt[:100],
                            'source_url': article_url
                        }
            
            # Strategy 4: First large image with alt text (fallback)
            images = soup.find_all('img', alt=True, src=True)[:10]  # Limit to first 10 images
            for img in images:
                src = img.get('src') or img.get('data-src')
                alt = img.get('alt', '').strip()
                
                if (src and alt and len(alt) > 5 and 
                    self._is_valid_image_url(src) and 
                    self._is_likely_content_image(src, alt)):
                    return {
                        'url': urljoin(article_url, src),
                        'alt': alt[:100],
                        'source_url': article_url
                    }
            
            return None
            
        except Exception as e:
            return {
                'error': str(e),
                'source_url': article_url,
                'error_type': type(e).__name__
            }
    
    def extract_images_from_group(self, similar_headlines, topic_name):
        """
        Improved image extraction with smarter source selection.
        Prioritizes reliable news sources and uses fewer attempts.
        """
        # Prioritize major news sources (more likely to have good meta tags)
        priority_sources = [
            'Reuters', 'AP News', 'BBC', 'CNN', 'NPR', 'The Guardian', 
            'Washington Post', 'New York Times', 'Wall Street Journal',
            'TechCrunch', 'Ars Technica', 'The Verge', 'Wired'
        ]
        
        # Group headlines by source
        headlines_by_source = {}
        for headline in similar_headlines:
            source = headline['source']
            if source not in headlines_by_source:
                headlines_by_source[source] = []
            headlines_by_source[source].append(headline)
        
        # Sort sources by priority
        sources_to_try = []
        
        # First, add priority sources if available
        for priority_source in priority_sources:
            for source in headlines_by_source:
                if priority_source.lower() in source.lower():
                    sources_to_try.append(source)
                    break
        
        # Then add remaining sources
        remaining_sources = [s for s in headlines_by_source if s not in sources_to_try]
        import random
        random.shuffle(remaining_sources)
        sources_to_try.extend(remaining_sources)
        
        attempted_sources = []
        errors = []
        
        # Try only 3 sources maximum for efficiency
        for source in sources_to_try[:3]:
            # Pick the first headline from this source (usually the most important)
            headline = headlines_by_source[source][0]
            attempted_sources.append(source)
            
            self.update_progress(json.dumps({
                "status": "progress",
                "message": f"Extracting image from {source} for: {topic_name[:40]}...",
            }))
            
            result = self.extract_article_image(headline["url"])
            
            if result and 'url' in result:
                result['attempted_sources'] = attempted_sources
                return result
            elif result and 'error' in result:
                errors.append({
                    'source': source,
                    'url': headline["url"],
                    'error': result['error'],
                    'error_type': result['error_type']
                })
        
        # All attempts failed
        return {
            'error': 'Failed to extract image from all attempted sources',
            'error_type': 'ExtractionFailure',
            'attempted_sources': attempted_sources,
            'detailed_errors': errors,
            'total_attempts': len(attempted_sources)
        }
    
    def _is_valid_image_url(self, url):
        """Quick validation for image URLs"""
        if not url or len(url) < 10:
            return False
        
        url_lower = url.lower()
        
        # Must be a valid image extension or contain image-like patterns
        valid_extensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
        has_valid_extension = any(ext in url_lower for ext in valid_extensions)
        
        # Or contains image-like patterns common in news sites
        image_patterns = ['image', 'photo', 'picture', 'img', 'media']
        has_image_pattern = any(pattern in url_lower for pattern in image_patterns)
        
        if not (has_valid_extension or has_image_pattern):
            return False
        
        # Skip obvious non-content images
        skip_patterns = [
            'logo', 'icon', 'avatar', 'profile', 'thumbnail',
            'ad', 'banner', 'sponsor', 'promo',
            '1x1', 'pixel', 'tracking', 'beacon'
        ]
        
        return not any(pattern in url_lower for pattern in skip_patterns)
    
    def _is_likely_content_image(self, src, alt):
        """
        Simplified content image detection.
        """
        src_lower = src.lower()
        alt_lower = alt.lower()
        
        # Skip tracking and ads
        skip_terms = [
            'pixel', 'tracking', '1x1', 'beacon', 'analytics',
            'ad', 'banner', 'sponsor', 'promo',
            'facebook', 'twitter', 'instagram', 'linkedin', 
            'share', 'icon', 'logo', 'button'
        ]
        
        if any(term in src_lower or term in alt_lower for term in skip_terms):
            return False
        
        # Must have meaningful alt text
        if len(alt.strip()) < 8:
            return False
        
        return True
    # =====================================================================
    # END OF EXPERIMENTAL FEATURE
    # =====================================================================

    def _normalize_text(self, text):
        """Normalize text for better comparison"""
        # Convert to lowercase
        text = text.lower()
        # Remove punctuation and extra spaces
        text = re.sub(r"[^\w\s]", " ", text)
        # Remove extra whitespace
        text = " ".join(text.split())
        return text

    def _extract_key_phrases(self, text):
        """Extract meaningful phrases and entities from text"""
        normalized = self._normalize_text(text)
        words = normalized.split()

        # Get single important words
        important_words = []
        # Get 2-word phrases
        phrases = []

        stop_words = {
            "a",
            "an",
            "the",
            "and",
            "but",
            "or",
            "for",
            "nor",
            "on",
            "at",
            "to",
            "from",
            "by",
            "with",
            "in",
            "of",
            "is",
            "are",
            "was",
            "were",
            "be",
            "been",
            "being",
            "have",
            "has",
            "had",
            "do",
            "does",
            "did",
            "can",
            "could",
            "will",
            "would",
            "shall",
            "should",
            "may",
            "might",
            "must",
            "that",
            "which",
            "who",
            "whom",
            "this",
            "these",
            "those",
            "how",
            "why",
            "when",
            "where",
            "what",
            # custom
            "hn",
            "nyt",
            "know",
            "best",
            "than",
            "just",
            "your",
            "its",
            "hint and answers",
            "you",
        }

        # Extract meaningful single words (longer than 2 chars, not stop words)
        for word in words:
            if len(word) > 2 and word not in stop_words:
                important_words.append(word)

        # Extract 2-word phrases
        for i in range(len(words) - 1):
            if (
                len(words[i]) > 2
                and len(words[i + 1]) > 2
                and words[i] not in stop_words
                and words[i + 1] not in stop_words
            ):
                phrases.append(f"{words[i]} {words[i + 1]}")

        return important_words, phrases

    def _calculate_similarity_score(self, text1, text2):
        """Calculate comprehensive similarity score between two texts with stricter grouping"""
        words1, phrases1 = self._extract_key_phrases(text1)
        words2, phrases2 = self._extract_key_phrases(text2)

        # Require at least one phrase match for high similarity
        phrase_overlap = len(set(phrases1) & set(phrases2))
        if phrase_overlap == 0:
            # If no phrase overlap, require significant word overlap
            word_overlap = len(set(words1) & set(words2))
            if word_overlap < 3:  # Stricter requirement
                return 0
            word_score = word_overlap * 1.5
        else:
            # Phrase matches get high scores
            word_overlap = len(set(words1) & set(words2))
            word_score = word_overlap * 2
            phrase_score = phrase_overlap * 6  # Higher weight for phrases
            word_score += phrase_score

        # Semantic coherence check - penalize if headlines are about different topics
        # Check for conflicting keywords that suggest different topics
        conflicting_pairs = [
            ("election", "sports"),
            ("politics", "gaming"),
            ("business", "weather"),
            ("covid", "entertainment"),
            ("war", "tech"),
            ("climate", "fashion"),
        ]

        text1_lower = text1.lower()
        text2_lower = text2.lower()

        for pair in conflicting_pairs:
            if (pair[0] in text1_lower and pair[1] in text2_lower) or (
                pair[1] in text1_lower and pair[0] in text2_lower
            ):
                word_score *= 0.3  # Heavy penalty for conflicting topics

        # Length penalty to avoid grouping very different length headlines
        len_diff = abs(len(words1) - len(words2))
        length_penalty = min(len_diff * 0.5, 2)  # Reduced penalty

        total_score = word_score - length_penalty
        return max(0, total_score)

    def find_common_headlines(self, news_data, is_topic=False, is_last_week=False):
        """Identifies headlines common across different sources with improved grouping"""
        if not news_data or "sources" not in news_data:
            return []

        # Set similarity threshold based on context - higher thresholds for stricter grouping
        if is_topic and is_last_week:
            similarity_threshold = 12  # Increased
        elif is_topic:
            similarity_threshold = 9  # Increased
        elif is_last_week:
            similarity_threshold = 14  # Increased
        else:
            similarity_threshold = 10  # Increased

        # Flatten all headlines
        all_headlines = []
        for source, headlines in news_data["sources"].items():
            for headline in headlines:
                all_headlines.append(
                    {
                        "source": source,
                        "title": headline["title"],
                        "url": headline["url"],
                        "time": headline.get("time"),
                        "source_link": headline.get("source_link"),
                    }
                )

        total_headlines = len(all_headlines)
        self.update_progress(
            json.dumps(
                {
                    "status": "progress",
                    "message": "Starting headline analysis...",
                    "processed": 0,
                    "total": total_headlines,
                }
            )
        )

        common_topics = []
        processed_headlines = set()

        # Compare headlines with improved similarity scoring
        for i, headline1 in enumerate(all_headlines, 1):
            if headline1["title"] in processed_headlines:
                self.update_progress(
                    json.dumps(
                        {
                            "status": "progress",
                            "message": "Analyzing headlines...",
                            "processed": i,
                            "total": total_headlines,
                        }
                    )
                )
                continue

            similar_headlines = []

            for headline2 in all_headlines:
                if headline1["title"] == headline2["title"]:
                    continue

                if headline2["title"] in processed_headlines:
                    continue

                # Calculate similarity score
                similarity_score = self._calculate_similarity_score(
                    headline1["title"], headline2["title"]
                )

                if similarity_score >= similarity_threshold:
                    if not similar_headlines:
                        similar_headlines.append(
                            {
                                "source": headline1["source"],
                                "title": headline1["title"],
                                "url": headline1["url"],
                                "time": headline1.get("time"),
                                "source_link": headline1.get("source_link"),
                            }
                        )

                    similar_headlines.append(
                        {
                            "source": headline2["source"],
                            "title": headline2["title"],
                            "url": headline2["url"],
                            "time": headline2.get("time"),
                            "source_link": headline2.get("source_link"),
                        }
                    )

            # Process similar headlines with stricter requirements
            if similar_headlines and len(similar_headlines) >= self.min_group_size:
                sources = {h["source"] for h in similar_headlines}
                # Require at least 3 different sources for better validation
                if len(sources) >= 3:
                    topic_name = self.generate_topic_name(similar_headlines)

                    # Skip if topic name is too generic or too short
                    if len(topic_name.split()) >= 2 and not self._is_generic_topic(
                        topic_name
                    ):
                        topic_data = {
                            "id": len(common_topics) + 1,
                            "topic_name": topic_name,
                            "count": len(similar_headlines),
                            "sources_count": len(sources),
                            "headlines": similar_headlines,
                        }

                        # =====================================================================
                        # EXPERIMENTAL FEATURE: Extract image from multiple articles in the group
                        # If you want to remove this feature, delete this code block
                        # =====================================================================
                        try:
                            image_result = self.extract_images_from_group(
                                similar_headlines, topic_name
                            )
                            # Always add image data, whether successful or failed
                            topic_data["image"] = image_result
                        except Exception as e:
                            # Fallback error handling
                            topic_data["image"] = {
                                "error": f"Unexpected error during image extraction: {str(e)}",
                                "error_type": "UnexpectedError",
                                "attempted_sources": [],
                                "total_attempts": 0,
                            }
                        # =====================================================================
                        # END OF EXPERIMENTAL FEATURE
                        # =====================================================================

                        common_topics.append(topic_data)

                        for headline in similar_headlines:
                            processed_headlines.add(headline["title"])

            self.update_progress(
                json.dumps(
                    {
                        "status": "progress",
                        "message": "Analyzing headlines...",
                        "processed": i,
                        "total": total_headlines,
                    }
                )
            )

        # Sort by size
        common_topics.sort(key=lambda x: x["count"], reverse=True)

        # Re-assign IDs
        for i, topic in enumerate(common_topics, 1):
            topic["id"] = i

        return common_topics

    def _is_generic_topic(self, topic_name):
        """Check if a topic name is too generic"""
        generic_terms = [
            "new report",
            "latest news",
            "breaking news",
            "recent update",
            "major announcement",
            "important news",
            "big news",
            "top story",
        ]
        topic_lower = topic_name.lower()
        return any(generic in topic_lower for generic in generic_terms)

    def generate_topic_name(self, headlines):
        """Enhanced topic name generation with better insight extraction"""
        stop_words = {
            "a",
            "an",
            "the",
            "and",
            "but",
            "or",
            "for",
            "nor",
            "on",
            "at",
            "to",
            "from",
            "by",
            "with",
            "in",
            "of",
            "is",
            "are",
            "was",
            "were",
            "be",
            "been",
            "being",
            "have",
            "has",
            "had",
            "do",
            "does",
            "did",
            "can",
            "could",
            "will",
            "would",
            "shall",
            "should",
            "may",
            "might",
            "must",
            "that",
            "which",
            "who",
            "whom",
            "this",
            "these",
            "those",
            "how",
            "why",
            "when",
            "where",
            "what",
            # custom
            "hn",
            "nyt",
            "know",
            "best",
            "than",
            "just",
            "your",
            "its",
            "hint and answers",
            "you",
        }

        # Extract specific entities and key terms
        all_entities = []
        all_important_phrases = []
        all_keywords = []

        for headline in headlines:
            title = headline["title"]
            normalized = self._normalize_text(title)
            words = normalized.split()

            # Extract entities (capitalized words from original)
            original_words = title.split()
            for word in original_words:
                clean_word = re.sub(r"[^\w]", "", word)
                if (
                    len(clean_word) > 2
                    and word[0].isupper()
                    and clean_word.lower() not in stop_words
                ):
                    all_entities.append(clean_word)

            # Extract meaningful 3-4 word phrases
            for i in range(len(words) - 2):
                if (
                    len(words[i]) > 2
                    and len(words[i + 1]) > 2
                    and len(words[i + 2]) > 2
                    and words[i] not in stop_words
                    and words[i + 1] not in stop_words
                    and words[i + 2] not in stop_words
                ):
                    phrase = f"{words[i]} {words[i + 1]} {words[i + 2]}"
                    all_important_phrases.append(phrase)

                    # Also try 4-word phrases
                    if (
                        i < len(words) - 3
                        and len(words[i + 3]) > 2
                        and words[i + 3] not in stop_words
                    ):
                        phrase4 = f"{phrase} {words[i + 3]}"
                        all_important_phrases.append(phrase4)

            # Extract important keywords (non-stop words)
            for word in words:
                if word not in stop_words and len(word) > 2:
                    all_keywords.append(word)

        # Count frequencies
        entity_counter = Counter(all_entities)
        phrase_counter = Counter(all_important_phrases)
        keyword_counter = Counter(all_keywords)

        # Minimum frequency threshold
        min_freq = max(2, len(headlines) // 4)

        # Try longer phrases first (4+ words) that appear frequently
        long_phrases = [
            (phrase, count)
            for phrase, count in phrase_counter.most_common()
            if count >= min_freq and len(phrase.split()) >= 4
        ]

        if long_phrases:
            return long_phrases[0][0].title()

        # Try 3-word phrases
        medium_phrases = [
            (phrase, count)
            for phrase, count in phrase_counter.most_common()
            if count >= min_freq and len(phrase.split()) == 3
        ]

        if medium_phrases:
            return medium_phrases[0][0].title()

        # Try entity + keyword combinations
        common_entities = [
            (entity, count)
            for entity, count in entity_counter.most_common()
            if count >= min_freq
        ]
        common_keywords = [
            (keyword, count)
            for keyword, count in keyword_counter.most_common()
            if count >= min_freq
        ]

        if common_entities and common_keywords:
            entity = common_entities[0][0]
            # Find a keyword that's not just the entity in lowercase
            for keyword, _ in common_keywords:
                if keyword.lower() != entity.lower():
                    # Try to find context words that appear with this entity
                    context_words = []
                    for headline in headlines:
                        if entity.lower() in headline["title"].lower():
                            words = self._normalize_text(headline["title"]).split()
                            for word in words:
                                if (
                                    word != entity.lower()
                                    and word not in stop_words
                                    and len(word) > 2
                                    and word in [k for k, _ in common_keywords[:5]]
                                ):
                                    context_words.append(word)

                    if context_words:
                        context_counter = Counter(context_words)
                        best_context = context_counter.most_common(1)[0][0]
                        return f"{entity} {best_context.title()}"
                    else:
                        return f"{entity} {keyword.title()}"

        # Try just the most common entity with descriptive context
        if common_entities:
            entity = common_entities[0][0]
            # Look for action words or descriptive terms
            action_words = []
            for headline in headlines:
                if entity.lower() in headline["title"].lower():
                    words = headline["title"].lower().split()
                    for word in words:
                        clean_word = re.sub(r"[^\w]", "", word)
                        if (
                            clean_word not in stop_words
                            and len(clean_word) > 3
                            and clean_word != entity.lower()
                            and any(
                                action in clean_word
                                for action in [
                                    "announce",
                                    "launch",
                                    "report",
                                    "reveal",
                                    "update",
                                    "plan",
                                    "face",
                                    "deal",
                                    "issue",
                                    "problem",
                                    "crisis",
                                ]
                            )
                        ):
                            action_words.append(clean_word)

            if action_words:
                action_counter = Counter(action_words)
                best_action = action_counter.most_common(1)[0][0]
                return f"{entity} {best_action.title()}"

            # Fallback to entity + most common keyword
            if common_keywords:
                return f"{entity} {common_keywords[0][0].title()}"

        # Final fallback - use most descriptive keywords
        if len(common_keywords) >= 3:
            return f"{common_keywords[0][0].title()} {common_keywords[1][0].title()} {common_keywords[2][0].title()}"
        elif len(common_keywords) >= 2:
            return f"{common_keywords[0][0].title()} {common_keywords[1][0].title()}"
        elif len(common_keywords) >= 1:
            return common_keywords[0][0].title()

        # Ultimate fallback - use first headline truncated
        first_headline = headlines[0]["title"]
        return first_headline[:60] + ("..." if len(first_headline) > 60 else "")

    def update_progress(self, message):
        """Updates progress information"""
        print(message, flush=True)

    def run(self, topic=None, last_week=False):
        """Main entry point to run the scraper"""
        if topic and topic not in self.AVAILABLE_TOPICS:
            print(
                json.dumps(
                    {
                        "status": "error",
                        "message": f"Invalid topic. Available topics: {', '.join(self.AVAILABLE_TOPICS)}",
                    }
                )
            )
            return

        try:
            # Scrape data
            if last_week:
                news_data = self.scrape_last_week(topic)
            else:
                news_data = self.scrape_today(topic)

            if not news_data or not news_data.get("sources"):
                print(
                    json.dumps(
                        {
                            "status": "error",
                            "message": "No data found. Please check your internet connection and try again.",
                        }
                    )
                )
                return

            # Store topic information
            if topic:
                news_data["topic"] = topic

            # Find common headlines
            common_topics = self.find_common_headlines(
                news_data, is_topic=bool(topic), is_last_week=last_week
            )

            # Prepare result
            result = {
                "date": news_data.get(
                    "date_range", datetime.now().strftime("%Y-%m-%d")
                ),
                "topic": news_data.get("topic", "all"),
                "is_last_week": last_week,
                "common_topics": common_topics,
                "total_groups": len(common_topics),
                "total_headlines": sum(
                    group.get("count", len(group["headlines"]))
                    for group in common_topics
                ),
            }

            # Output final result as JSON
            print(json.dumps(result))

        except Exception as e:
            print(json.dumps({"status": "error", "message": str(e)}))


def main():
    """Command-line interface for the Brutalist Report Scraper"""
    parser = argparse.ArgumentParser(description="Enhanced Brutalist Report Scraper")
    parser.add_argument(
        "--topic",
        choices=BrutalistReportScraper.AVAILABLE_TOPICS,
        help="Filter by topic (tech, news, business, science, gaming, culture, politics, sports)",
    )
    parser.add_argument(
        "--last-week",
        action="store_true",
        help="Scrape last week's headlines instead of today's",
    )

    args = parser.parse_args()

    try:
        scraper = BrutalistReportScraper()
        scraper.run(topic=args.topic, last_week=args.last_week)
    except KeyboardInterrupt:
        print(
            json.dumps({"status": "error", "message": "Operation cancelled by user."})
        )
        sys.exit(1)
    except Exception as e:
        print(json.dumps({"status": "error", "message": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
