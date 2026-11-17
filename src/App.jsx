
import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "https://rickandmortyapi.com/api/character";

function App() {
  // Character data
  const [characters, setCharacters] = useState([]);
  const [info, setInfo] = useState({
    count: 0,
    pages: 0,
    next: null,
    prev: null,
  });

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [offlineNotice, setOfflineNotice] = useState("");

  // Search, filter
  const [searchInput, setSearchInput] = useState("");
  const [searchName, setSearchName] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [retryCount, setRetryCount] = useState(0);

  // Character details
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  // Fetched characters from the API
  useEffect(() => {
    let ignore = false;

    async function fetchCharacters() {
      setLoading(true);
      setError("");
      setOfflineNotice("");

      const params = new URLSearchParams();
      params.set("page", page);

      if (searchName.trim()) {
        params.set("name", searchName.trim());
      }

      if (status) {
        params.set("status", status);
      }

      const queryString = params.toString();
      const cacheKey = `portal-characters-${queryString}`;

      try {
        const response = await fetch(
          `${API_URL}?${queryString}`
        );

        // 404 means no characters match the filters
        if (response.status === 404) {
          if (!ignore) {
            setCharacters([]);
            setInfo({
              count: 0,
              pages: 0,
              next: null,
              prev: null,
            });
          }
          return;
        }

        // Checks whether the request succeeded
        if (!response.ok) {
          throw new Error(
            `Request failed with status ${response.status}.`
          );
        }

        const data = await response.json();

        if (!ignore) {
          setCharacters(data.results);
          setInfo(data.info);

          // Saves successful results for offline use
          try {
            localStorage.setItem(
              cacheKey,
              JSON.stringify(data)
            );
          } catch (storageError) {
            console.warn("Unable to save character cache.", storageError);
          }

          setOfflineNotice("");
        }
      } catch (err) {
        if (!ignore) {
          // Checks whether this page was previously saved
          try {
            const savedData = localStorage.getItem(cacheKey);

            if (savedData) {
              const cachedData = JSON.parse(savedData);

              setCharacters(cachedData.results);
              setInfo(cachedData.info);
              setOfflineNotice(
                "You're offline. Showing previously saved characters."
              );
            } else {
              setCharacters([]);
              setError(
                "Unable to connect to the character database. Check your internet connection and try again."
              );
            }
          } catch (cacheError) {
            setCharacters([]);
            setError(
              "Unable to load characters. Please check your connection and try again."
            );
          }
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    fetchCharacters();

    // Ignores outdated requests
    return () => {
      ignore = true;
    };
  }, [page, searchName, status, retryCount]);

  // Searches the form
  function handleSearch(event) {
    event.preventDefault();
    setPage(1);
    setSearchName(searchInput.trim());
    setRetryCount((count) => count + 1);
  }

  // Status filter
  function handleStatusChange(event) {
    setStatus(event.target.value);
    setPage(1);
  }

  // Retry failed request
  function handleRetry() {
    setRetryCount((count) => count + 1);
  }

  // Clear all filters
  function clearFilters() {
    setSearchInput("");
    setSearchName("");
    setStatus("");
    setPage(1);
    setRetryCount((count) => count + 1);
  }

  // Previous page
  function handlePrevious() {
    if (info.prev) {
      setPage((currentPage) => Math.max(1, currentPage - 1));
    }
  }

  // Next page
  function handleNext() {
    if (info.next) {
      setPage((currentPage) => currentPage + 1);
    }
  }

  // Status styling
  function getStatusClass(characterStatus) {
    if (characterStatus === "Alive") return "alive";
    if (characterStatus === "Dead") return "dead";
    return "unknown";
  }

  // Fetch individual character details
  useEffect(() => {
    if (!selectedCharacter) {
      setDetail(null);
      setDetailError("");
      return;
    }

    let ignore = false;

    async function fetchCharacterDetails() {
      setDetailLoading(true);
      setDetailError("");
      setDetail(null);

      const detailCacheKey = `portal-character-${selectedCharacter.id}`;

      try {
        const response = await fetch(
          `${API_URL}/${selectedCharacter.id}`
        );

        if (!response.ok) {
          throw new Error("Unable to load character details.");
        }

        const data = await response.json();

        if (!ignore) {
          setDetail(data);

          try {
            localStorage.setItem(
              detailCacheKey,
              JSON.stringify(data)
            );
          } catch (storageError) {
            console.warn("Unable to save character details.", storageError);
          }
        }
      } catch (err) {
        if (!ignore) {
          try {
            const savedDetail = localStorage.getItem(detailCacheKey);

            if (savedDetail) {
              setDetail(JSON.parse(savedDetail));
              setDetailError(
                "You're offline. Showing saved character details."
              );
            } else {
              setDetailError(
                "Unable to load this character. Please try again."
              );
            }
          } catch (cacheError) {
            setDetailError("Unable to load character details.");
          }
        }
      } finally {
        if (!ignore) {
          setDetailLoading(false);
        }
      }
    }

    fetchCharacterDetails();

    return () => {
      ignore = true;
    };
  }, [selectedCharacter]);

  // Close detail modal
  function closeDetails() {
    setSelectedCharacter(null);
    setDetail(null);
    setDetailError("");
  }

  // Retry detail request
  function retryDetails() {
    if (selectedCharacter) {
      setSelectedCharacter({ ...selectedCharacter });
    }
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="brand">
          <div className="brand-icon">P</div>

          <div className="brand-text">
            <h1>PORTAL</h1>
            <p>COMICS & GAMES</p>
          </div>
        </div>

        <div className="header-right">
          <span className="online-dot"></span>
          CHARACTER DATABASE
        </div>
      </header>

      <main className="main-content">
        {/* Hero */}
        <section className="hero">
          <p className="eyebrow">MULTIVERSE DATABASE</p>

          <h2>Character Lookup</h2>

          <p className="hero-description">
            Explore the universe of Rick and Morty.
            Search characters, discover their stories,
            and find your favorites.
          </p>
        </section>

        {/* Search and filters */}
        <section className="controls">
          <form className="search-form" onSubmit={handleSearch}>
            <input
              type="search"
              placeholder="Search characters by name..."
              value={searchInput}
              onChange={(event) =>
                setSearchInput(event.target.value)
              }
              aria-label="Search characters by name"
            />

            <button type="submit" className="search-button">
              Search
            </button>
          </form>

          <select
            className="status-select"
            value={status}
            onChange={handleStatusChange}
            aria-label="Filter characters by status"
          >
            <option value="">All Statuses</option>
            <option value="alive">Alive</option>
            <option value="dead">Dead</option>
            <option value="unknown">Unknown</option>
          </select>
        </section>

        {/* Results heading */}
        <section className="results-heading">
          <div>
            <h3>Explore Characters</h3>

            <p>
              {info.count > 0
                ? `${info.count} characters found`
                : "Browse the multiverse"}
            </p>
          </div>
        </section>

        {/* Loading state */}
        {loading && (
          <div className="message" role="status">
            <div className="spinner"></div>
            <h3>Loading characters...</h3>
            <p>Connecting to the multiverse database.</p>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="message error-message" role="alert">
            <div className="message-icon">!</div>

            <h3>Something went wrong</h3>

            <p>{error}</p>

            <button
              onClick={handleRetry}
              className="retry-button"
            >
              Try again
            </button>
          </div>
        )}

        {/* No results state */}
        {!loading && !error && characters.length === 0 && (
          <div className="message">
            <div className="message-icon">?</div>

            <h3>No characters found</h3>

            <p>
              We couldn't find anyone matching your search.
              Try another name or change your filters.
            </p>

            <button
              className="retry-button"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Character results */}
        {!loading && !error && characters.length > 0 && (
          <>
            {offlineNotice && (
              <div className="offline-notice" role="status">
                <span>⚠</span> {offlineNotice}
              </div>
            )}

            <section className="character-grid">
              {characters.map((character) => (
                <article
                  className="character-card"
                  key={character.id}
                  onClick={() =>
                    setSelectedCharacter(character)
                  }
                  tabIndex={0}
                  role="button"
                  aria-label={`View details for ${character.name}`}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" ||
                      event.key === " "
                    ) {
                      event.preventDefault();
                      setSelectedCharacter(character);
                    }
                  }}
                >
                  <div className="character-image">
                    <img
                      src={character.image}
                      alt={character.name}
                      loading="lazy"
                    />

                    <span
                      className={`status-badge ${getStatusClass(
                        character.status
                      )}`}
                    >
                      <span className="status-dot"></span>
                      {character.status}
                    </span>
                  </div>

                  <div className="character-info">
                    <h3>{character.name}</h3>

                    <p>{character.species}</p>

                    <span className="view-details">
                      VIEW DETAILS →
                    </span>
                  </div>
                </article>
              ))}
            </section>

            {/* Pagination */}
            <nav className="pagination" aria-label="Character pages">
              <button
                disabled={!info.prev}
                onClick={handlePrevious}
              >
                ← Previous
              </button>

              <span>
                Page {page} of {info.pages}
              </span>

              <button
                disabled={!info.next}
                onClick={handleNext}
              >
                Next →
              </button>
            </nav>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>PORTAL COMICS & GAMES</p>
        <p>Powered by the Rick and Morty API</p>
      </footer>

      {/* Character details modal */}
      {selectedCharacter && (
        <div
          className="modal-overlay"
          onClick={closeDetails}
        >
          <section
            className="detail-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Character details"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="close-button"
              onClick={closeDetails}
              aria-label="Close character details"
            >
              ×
            </button>

            {detailLoading && (
              <div className="message detail-loading">
                <div className="spinner"></div>
                <h3>Loading character details...</h3>
              </div>
            )}

            {detailError && !detail && (
              <div className="message error-message">
                <h3>Unable to load details</h3>
                <p>{detailError}</p>

                <button
                  className="retry-button"
                  onClick={retryDetails}
                >
                  Try again
                </button>
              </div>
            )}

            {detailError && detail && (
              <div className="offline-notice">
                {detailError}
              </div>
            )}

            {detail && !detailLoading && (
              <div className="detail-content">
                <img
                  src={detail.image}
                  alt={detail.name}
                />

                <div className="detail-text">
                  <p className="eyebrow">
                    CHARACTER PROFILE
                  </p>

                  <h2>{detail.name}</h2>

                  <span
                    className={`status-badge ${getStatusClass(
                      detail.status
                    )}`}
                  >
                    <span className="status-dot"></span>
                    {detail.status}
                  </span>

                  <div className="detail-list">
                    <p>
                      <strong>Species:</strong> {detail.species}
                    </p>

                    <p>
                      <strong>Gender:</strong> {detail.gender}
                    </p>

                    <p>
                      <strong>Origin:</strong> {detail.origin.name}
                    </p>

                    <p>
                      <strong>Current Location:</strong>{" "}
                      {detail.location.name}
                    </p>

                    <p>
                      <strong>Episodes:</strong>{" "}
                      {detail.episode.length}
                    </p>
                  </div>

                  <button
                    className="retry-button close-detail-button"
                    onClick={closeDetails}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
