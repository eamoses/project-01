$(document).ready(function() {
  $.get('/api/cats').success(function (cats) {
    cats.forEach(function(cat) {
      renderCat(cat);
    });
  });

  $('#newCatForm').on('submit', function(e) {
    e.preventDefault();
    var formData = $(this).serialize();
    $.post('/api/cats', formData, function(cat) {
      renderCat(cat);
    });
    $(this).trigger("reset");
  });

  //INFO BUTTON POPUP
  $('#infoImage').on('click', function(){
    $('.pop.hidden').removeClass('hidden');
  });
  $('.close').on('click', function(){
    $('.pop').addClass('hidden');
  });

  //get and handle click on the add owner email button
  $('#cats').on('click', '.owner-email', handleAddOwnerClick);

  $('#saveOwner').on('click', handleNewOwnerSubmit);
  $('#cats').on('click', '.delete-cat', handleDeleteCatClick);
  $('#cats').on('click', '.edit-cat', handleCatEditClick);
  $('#cats').on('click', '.save-cat', handleSaveChangesClick);

});

// GOOGLE MAP FUNCTIONALITY BELOW
var map;
var infoWindow;
var service;

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 37.78, lng: -122.44},
    zoom: 10,
    styles: [{
      stylers: [{ visibility: 'simplified' }]
    }, {
      elementType: 'labels',
      stylers: [{ visibility: 'off' }]
    }]
  });

  infoWindow = new google.maps.InfoWindow();
  service = new google.maps.places.PlacesService(map);

  map.addListener('idle', performSearch);
}

function performSearch() {
  var request = {
    bounds: map.getBounds(),
    keyword: 'cats'
  };
  service.radarSearch(request, callback);
}

function callback(results, status) {
  if (status !== google.maps.places.PlacesServiceStatus.OK) {
    return;
  }
  for (var i = 0, result; result = results[i]; i++) {
    addMarker(result);
  }
}

function addMarker(place) {
  var marker = new google.maps.Marker({
    map: map,
    position: place.geometry.location,
    icon: {
      url: 'http://maps.gstatic.com/mapfiles/circle.png',
      anchor: new google.maps.Point(10, 10),
      scaledSize: new google.maps.Size(10, 17)
    }
  });

  google.maps.event.addListener(marker, 'click', function() {
    service.getDetails(place, function(result, status) {
      if (status !== google.maps.places.PlacesServiceStatus.OK) {
        console.error(status);
        return;
      }
      infoWindow.setContent(result.name);
      infoWindow.open(map, marker);
    });
  });
}
// GOOGLE MAP API FUNCTIONALITY ENDS

// when the edit button for a cat is clicked
function handleCatEditClick(e) {
  var $catRow = $(this).closest('.cat');
  var catId = $catRow.data('cat-id');

  $catRow.find('.save-cat').toggleClass('hidden');
  $catRow.find('.edit-cat').toggleClass('hidden');


  // get the cat name and replace its field with an input element
  var petName = $catRow.find('span.petName').text();
  $catRow.find('span.petName').html('<input class="edit-petName" value="' + petName + '"></input>');

  var pictureUrl = $catRow.find('span.pictureUrl').text();
  var catImage = $catRow.find('img.picUrlClass').attr('src');

  $catRow.find('span.pictureUrl').html('<input class="edit-picUrlClass" placeholder="Image Link" value="' + catImage + '"></input>');

  var locationLastSeen = $catRow.find('span.locationLastSeen').text();
  $catRow.find('span.locationLastSeen').html('<input class="edit-locationLastSeen" value="' + locationLastSeen + '"></input>');

  var dateLastSeen = $catRow.find('span.dateLastSeen').text();
  $catRow.find('span.dateLastSeen').html('<input class="edit-dateLastSeen" value="' + dateLastSeen + '"></input>');
}

// after editing a cat, when the save changes button is clicked
function handleSaveChangesClick(e) {
  var catId = $(this).parents('.cat').data('cat-id');
  var $catRow = $('[data-cat-id=' + catId + ']');

  var data = {
    petName: $catRow.find('.edit-petName').val(),
    pictureUrl: $catRow.find('.edit-picUrlClass').val(),
    locationLastSeen: $catRow.find('.edit-locationLastSeen').val(),
    dateLastSeen: $catRow.find('.edit-dateLastSeen').val()
  };

  $.ajax({
    method: 'PUT',
    url: '/api/cats/' + catId,
    data: data,
    success: handleCatUpdatedResponse
  });
}

function handleCatUpdatedResponse(data) {

  var catId = data._id;
  $('[data-cat-id=' + catId + ']').remove();
  renderCat(data);
  $('[data-cat-id=' + catId + ']')[0].scrollIntoView();
}

// when a delete button for a cat is clicked
function handleDeleteCatClick(e) {
  var catId = $(this).parents('.cat').data('cat-id');
  $.ajax({
    url: '/api/cats/' + catId,
    method: 'DELETE',
    success: handleDeleteCatSuccess
  });
}

// callback after DELETE /api/cats/:id
function handleDeleteCatSuccess(data) {
  var deletedCatId = data._id;
  $('div[data-cat-id=' + deletedCatId + ']').remove();
}

function fetchAndReRenderCatWithId(catId) {
  $.get('/api/cats/' + catId, function(data) {
    $('div[data-cat-id=' + catId + ']').remove();
    renderCat(data);
  });
}

// this function takes a single cat and renders it to the page
function renderCat(cat) {
  var catHtml = $('#cat-template').html();
  var catsTemplate = Handlebars.compile(catHtml);
  var html = catsTemplate(cat);
  $('#cats').prepend(html);
}

// when the add owner email button is clicked, display the modal
function handleAddOwnerClick(e) {
  var currentCatId = $(this).closest('.cat').data('cat-id');
  $('#ownerModal').data('cat-id', currentCatId);
  $('#ownerModal').modal();
}

// when the cat modal submit button is clicked:
function handleNewOwnerSubmit(e) {
  e.preventDefault();
  var $modal = $('#ownerModal');
  var $ownerEmailField = $modal.find('#ownerEmail');
  var dataToPost = {
      email: $ownerEmailField.val()
    };
  var catId = $modal.data('catId');
  var ownerPostToServerUrl = '/api/cats/'+ catId + '/owners';
  $.post(ownerPostToServerUrl, dataToPost, function(data) {
    $ownerEmailField.val('');
    $modal.modal('hide');
    fetchAndReRenderCatWithId(catId);
  }).error(function(err) {
    console.log('post to /api/cats/:catId/owners resulted in error', err);
  });
}
