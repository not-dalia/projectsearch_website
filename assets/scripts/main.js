var search = new JsSearch.Search('id');
search.tokenizer =
  new JsSearch.StopWordsTokenizer({
    tokenize(text /* string */ ) {
      var REGEX = /[^a-zа-яё0-9]+/i;

      return text
        .split(REGEX)
        .filter(
          (text) => text && text.trim().length >= 3 // Filter empty tokens
        );
    }
  });
search.tokenizer =
  new JsSearch.StemmingTokenizer(
    stemmer, new JsSearch.StopWordsTokenizer({
      tokenize(text /* string */ ) {
        var REGEX = /[^a-zа-яё0-9]+/i;

        return text
          .split(REGEX)
          .filter(
            (text) => text && text.trim().length >= 3 // Filter empty tokens
          );
      }
    }));
search.addIndex('title');
search.addIndex('research_theme');
search.addIndex('research_group');
search.addIndex('additional_keywords');
search.addIndex('technologies_languages');
search.addIndex('additional_details');
for (var key in window.store) {
  // console.log(key)
  search.addDocument({
    'id': key,
    'title': window.store[key].title,
    'research_theme': window.store[key].research_theme,
    'research_group': window.store[key].research_group,
    'additional_keywords': window.store[key].additional_keywords,
    'technologies_languages': window.store[key].technologies_languages,
    'additional_details': window.store[key].additional_details
  });
}

function toggleFilter(element) {
  // console.log(element);
  element.parentNode.classList.toggle('collapsed')
  if (element.parentNode.classList.contains('collapsed')) {
    if (element.parentNode.querySelector('input:checked')) {
      element.parentNode.classList.add('text-blue')
    } else {
      element.parentNode.classList.remove('text-blue')
    }
  } else {
    element.parentNode.classList.remove('text-blue')
  }
}

function toggleFilterMenu() {
  let filter = document.querySelector('.filter');
  let overlay = document.querySelector('.overlay');

  if (filter.classList.contains('open')) {
    filter.classList.remove('open');
    overlay.classList.remove('open');
    document.body.style.overflow = "auto";
  } else {
    filter.scrollTop = 0;
    filter.classList.add('open');
    overlay.classList.add('open');
    document.body.style.overflow = "hidden";
  }
}

function onSearchChange() {
  let searchQueryInput = document.querySelector('#search-query');
  let query = searchQueryInput.value;
  searchQueryResults = flexSearchQuery(query);
  populateResults();
}

function flexSearchQuery(query) {
  if (query && query.trim().length >= 3) {
    let results = search.search(query)
    if (results.tokens.length === 0) {
      return {documents: Object.keys(window.store), tokens: []};
    } else {
      let tokens = new Set(results.tokens);
      tokens.add(query.trim())
      tokens = Array.from(tokens)
      tokens = tokens.sort((a, b) => a.length > b.length ? -1 : 1)
      return {documents: results.documents.map(el => el.id), tokens: tokens };
    }
  } else {
    return {documents: Object.keys(window.store), tokens: []};
  }
}

function searchQuery(query) {
  if (query) {
    // Initalize lunr with the fields it will be searching on. I've given title
    // a boost of 10 to indicate matches on this field are more important.
    var idx = lunr(function () {
      this.field('id');
      this.field('title', {
        boost: 10
      });
      this.field('research_theme');
      this.field('additional_keywords');
      this.field('technologies_languages');
      this.field('additional_details');

      for (var key in window.store) { // Add the data to lunr
        this.add({
          'id': key,
          'title': window.store[key].title,
          'research_theme': window.store[key].research_theme,
          'additional_keywords': window.store[key].additional_keywords,
          'technologies_languages': window.store[key].technologies_languages,
          'additional_details': window.store[key].additional_details
        });
      }
    });

    var results = idx.search(query + '*'); // Get lunr to perform a search
    // displaySearchResults(results, window.store); // We'll write this in the next section
    return results;
  } else {
    return window.store;
  }
}

window.addEventListener('popstate', function(e) {
  var supervisorRef = e.state;
  if (supervisorRef == null) {
    let home = document.querySelector('.ps-container#home');
    if (!home) {
      if (document.querySelector('.ps-container#supervisor')) document.querySelector('.ps-container#supervisor').style.display = 'none';
      window.location.replace('/');
      return
    }
    document.title = "Supervisor Directory";
    document.querySelector('.ps-container#supervisor').style.display = 'none';
    document.querySelector('.ps-container#home').style.display = 'block';
  } else {
    var supervisor = window.store[supervisorRef]
    let home = document.querySelector('.ps-container#home');
    if (!supervisor || !home) {
      window.location.replace(window.location.href);
      return;
    }
    document.title = "Supervisor Directory | " + supervisor.title;
    document.querySelector('.ps-container#home').style.display = 'none';
    populateSupervisor(supervisor);
    document.querySelector('.ps-container#supervisor').style.display = 'block';
  }
});