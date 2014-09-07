// ------------- VIEW MODULE -------------

var storyView = (function() {
  var columnTemplate,
      cueTemplate,
      sentenceTemplate,
      currentSentenceContent;

  var initializeTemplates = function() {
    _.templateSettings = { interpolate: /\{\{(.+?)\}\}/g };

    columnTemplate = _.template($('#column-template').html());
    cueTemplate = _.template($('#cue-template').html());
    sentenceTemplate = _.template($('#sentence-template').html());
  };

  var initializeSentences = function() {
    if (sentencesJson.length > 0) {
      console.log(this);
      sentencesJson.forEach(storyView.buildSentence);
    }
  };

  var bindEventListeners = function() {
    $('body').on('focus', 'input.sentence', function(e){
      e.preventDefault();
      currentSentenceContent = $(this).val();
    });

    $('body').on('blur', 'input.sentence', function(e) {
      e.preventDefault();

      if ($(this).val() !== currentSentenceContent) {
        var sentence;
        var $sentence = $(this);
        var position = $sentence.attr('data-position');
        if ($sentence.attr('data-id')) {
          sentence = _.findWhere(story.sentences, {position: parseInt(position)});
          sentence.update($sentence.val());
        } else {
          var sentenceJson = sentenceElToJson($sentence);
          sentence = storyView.initializeSentence(sentenceJson);
          sentence.save();
        }
      }
    });
  };

  var calculateStartPosition = function(depth) {
    var position = 0;
    while (depth > 0) {
      position += Math.pow(3, depth);
      depth--;
    }
    return position + 1;
  };

  var calculateEndPosition = function(depth) {
    var start = calculateStartPosition(depth);
    return start + Math.pow(3, depth + 1) - 1;
  };

  var parentId = function(position) {
    return Math.ceil(position / 3) - 1;
  };

  var sentenceElToJson = function($sentence) {
    return {
      parent_id: parseInt($sentence.attr('data-parent-id')),
      depth: parseInt($sentence.attr('data-depth')),
      content: $sentence.val(),
      position: parseInt($sentence.attr('data-position')),
      id: parseInt($sentence.attr('data-id')) || ''
    };
  };

  return {
   buildColumn: function(depth) {
     var column = columnTemplate({depth: depth});
     var startPos = calculateStartPosition(depth);
     var endPos = calculateEndPosition(depth);
     var range = _.range(startPos, endPos + 1);
     _.each(range, function(element, index, list) {
        if (index % 3 === 0) {
          column += cueTemplate({cue: '', parent_id: parentId(element)});
        }
        column += sentenceTemplate({
          sentence_id: '',
          position: element,
          depth: depth,
          parent_id: parentId(element)
        });
      });
      column += "</div>";
      $('.slidee').append(column);
    },

    findOrInitializeColumn: function(depth) {
      if ($('.column[data-depth=' + depth + ']').length === 0) {
        this.buildColumn(depth);
      }
      return $('.column[data-depth=' + depth + ']');
    },

    initializeSentence: function(sentenceJson){
      var sentence = new Sentence(sentenceJson);
      story.sentences.push(sentence);
      return sentence;
    },

    buildSentence: function(sentenceJson) {
      var sentence = storyView.initializeSentence(sentenceJson);
      sentence.render();
    },

    initialize: function() {
     story.sentences = [];
     initializeTemplates();
     initializeSentences();
     bindEventListeners();
    }
  };


})();


// ----- SENTENCE MODEL ------
var Sentence = function(sentenceJson) {
  this.id = sentenceJson.id;
  this.position = sentenceJson.position;
  this.parentId = sentenceJson.parent_id;
  this.content = sentenceJson.content;
  this.depth = sentenceJson.depth;
  this.$el = null;
};

Sentence.prototype.toParams = function() {
  return {
    "sentence": {
      id: this.id,
      position: this.position,
      depth: this.depth,
      parent_id: this.parentId,
      content: this.content
    }
  };
};

Sentence.prototype.save = function() {
  var sentence = this;

  $.ajax({
    url: '/stories/' + story.id + '/sentences',
    method: 'POST',
    data: JSON.stringify(sentence.toParams()),
    dataType: 'json',
    contentType: 'application/json'
  }).done(function(data){
    console.log(data);
    sentence.id = data.id;
    sentence.render();
    sentence.updateCue();
  }).error(function(data){
    console.log(data);
  });
};

Sentence.prototype.update = function(newContent) {
  var sentence = this;
  sentence.content = newContent;

  $.ajax({
    url: '/stories/' + story.id + '/sentences/' + sentence.id,
    method: 'PUT',
    data: JSON.stringify(sentence.toParams()),
    dataType: 'json',
    contentType: 'application/json'
  }).done(function(data){
    sentence.updateCue();
    sentence.updateElement();
    console.log(data);
    console.log(sentence);
  }).error(function(data){
    console.log(data);
  });
};

Sentence.prototype.updateCue = function() {
  var cue = $('.cue[data-parent-id=' + this.position + ']');
  cue.html(this.content);
};

Sentence.prototype.render = function() {
  var column;
  if (this.depth === 0){
    column = $('.column[data-depth=0]');
  } else {
    column = storyView.findOrInitializeColumn(this.depth);
  }
  storyView.findOrInitializeColumn(this.depth + 1);
  this.$el = column.find('.sentence[data-position=' + this.position + ']');
  this.updateElement();
  this.updateCue();
};

Sentence.prototype.updateElement = function() {
  this.$el.attr('data-id', this.id);
  this.$el.val(this.content);
};

// ---------------------------------------------

$(document).ready(function(){
  storyView.initialize();
});
