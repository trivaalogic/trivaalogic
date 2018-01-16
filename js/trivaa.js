"use strict";

$(function () {
  /**
   * Mobile Browser Address-bar Resize Jump Fix.
   *
   * Prevent items with a height depending on the viewport from jumping if the
   * mobile browser address bar appreas/disappears.
   * This fixes the address-bar viewport resize jump problem of many mobile
   * Browsers.
   *
   * Usage:
   *
   *   Put this data attribute: "data-jump-fix" on each html element that has
   *   height depending on the vp height.
   *
   *   load the script and call JumpFix.init()
   *
   */
  const JumpFix = {
    fixItems: $('*[data-jump-fix]'), // Get all items with the data attribute.
    isScrolling: false,
    timeoutScroll: null,

    // This sets 'isScrolling' to true for a certain amount of time.
    setScrollingStatus: function () {
      if (JumpFix.timeoutScroll) {
        clearTimeout(JumpFix.timeoutScroll);
      }
      JumpFix.isScrolling = true;
      JumpFix.timeoutScroll = setTimeout(function () {
        JumpFix.isScrolling = false;
      }, 100);
    },

    // Save actual heights
    saveHeights: function () {
      JumpFix.fixItems.each(function (i) {
        JumpFix.fixItems[i].savedHeight = $(this).height();
      })
    },

    // window and document actions here
    bindUIActions: function () {
      // Set isScrolling when the user scrolls or swipes.
      $(window).scroll(function () {
        if (JumpFix.isScrolling === false) {
          JumpFix.saveHeights();
        }
        JumpFix.setScrollingStatus();
      });

      $(window).on({
        'touchmove': function () {
          if (JumpFix.isScrolling === false) {
            JumpFix.saveHeights();
          }
          JumpFix.setScrollingStatus();
        }
      });

      // On resize: if user is scrolling use the saved height.
      // if user is NOT scrolling save the new nativ height after resize.
      $(window).resize(function () {
        if (JumpFix.isScrolling === true) {
          JumpFix.fixItems.each(function (i) {
            $(this).height(JumpFix.fixItems[i].savedHeight);
          })
        } else {
          JumpFix.fixItems.each(function () {
            $(this).css('height', '');
          });
        }
      });
    },

    init: function () {
      this.bindUIActions();
    }
  };

  /**
   * Height of the navbar, reused at many places.
   */
  const navbarHeight = $('.navbar').outerHeight();

  /**
   * Gets the viewport height.
   * 
   * @return {number} the viewport height
   */
  function viewportHeight() {
    return window.innerHeight;
  }

  /**
   * Scrolls to the specified target element smoothly.
   * 
   * @param {jQuery} target the target element
   * @param {object} center if truthy, the top of the element will be centered on the screen
   */
  function scrollToTarget(target, center) {
    // Calculate the target offset.
    let scrollTargetOffset;
    if (center) scrollTargetOffset = target.offset().top - viewportHeight() / 2;
    else scrollTargetOffset = target.offset().top - navbarHeight;

    // Do the scrolling
    $('html, body').animate({
      scrollTop: scrollTargetOffset
    }, 400);
  }

  /**
   * Configures smooth scroll of inner links within the specified container. Makes sure the location is not updated with the
   * hashtag of the anchor.
   * 
   * @param container
   *            JQuery object pointing to the container(s) in which to look for anchors
   */
  function configureScrollToTarget(container) {
    container.find('a[href*="#"]:not([href="#"])').off('click').click(function (e) {
      // This prevents the update of the location bar.
      e.preventDefault();

      // Find the target anchor.
      var target = $(this.hash);
      target = target.length ? target : $('a[name=' + this.hash.slice(1) + ']:visible');

      // Scroll to it.
      if (target.length) scrollToTarget(target, target.data('scroll-center'));
    });
  }

  /**
   * Configures the navbar so that it closes on the mobile automatically when an item is selected.
   */
  function configureMobileNavbar() {
    const navbarToggler = $('button.navbar-toggler');
    $('nav.navbar a.nav-link').click(() => {
      if (navbarToggler.is(':visible')) navbarToggler.click();
    });

    const navbar = $('nav.navbar');
    const navbarCollapse = navbar.find('div.navbar-collapse');
    const hammerTime = new Hammer(navbar.get(0), {
      recognizers: [
        [Hammer.Swipe, {
          direction: Hammer.DIRECTION_VERTICAL
        }]
      ]
    });
    hammerTime.on('swipe', function (e) {
      let visible = navbarCollapse.is(':visible');
      if (e.direction == Hammer.DIRECTION_UP && visible || e.direction == Hammer.DIRECTION_DOWN && !visible) navbarToggler.click();
    });
  }

  /**
   * Sets up the navbar so that it dims when scrolled a little or when the toggler is activated..
   */
  function configureDimmingNavbar() {
    const scrollThreshold = 0;

    const navbar = $('nav.navbar');
    const navbarCollapse = navbar.find('div.navbar-collapse');
    const navbarToggler = $('button.navbar-toggler');

    /**
     * Actually dims the navbar depending on the scroll position.
     */
    function dimOnScroll() {
      if ($(window).scrollTop() > scrollThreshold) navbar.addClass('trivaa-dimmed-navbar');
      else if (!navbarToggler.is(':visible') || !navbarCollapse.is(':visible')) navbar.removeClass('trivaa-dimmed-navbar');
    }

    // Sets up the dimming function for the scroll event and on page load.
    $(window).scroll(dimOnScroll);
    dimOnScroll();

    navbarToggler.click(() => {
      let visible = navbarCollapse.is(':visible');
      if (!visible) navbar.addClass('trivaa-dimmed-navbar');
      else if (visible && $(window).scrollTop() <= scrollThreshold) navbar.removeClass('trivaa-dimmed-navbar');
    });
  }

  /**
   * Configures the behaviour of the process part on the desktop and the mobile.
   */
  function configureProcessPart() {
    /**
     * Deactivates all the steps which hides the text and resets the circle.
     */
    function deactivateAllSteps() {
      $('.trivaa-process-step').removeClass('active');
    }

    //
    // On the desktop, activate steps when hovering.
    //
    $('.trivaa-process-desktop .trivaa-process-step').on('mouseenter', function () {
      deactivateAllSteps();
      $(this).addClass('active');
    });
    $('.trivaa-process-desktop .trivaa-process-step').on('mouseleave', deactivateAllSteps);

    //
    // On the mobile, activate steps when scrolling near.
    //
    const steps = $('.trivaa-process-mobile .trivaa-process-step');

    /**
     * Activates the nearest step on scroll.
     */
    function activateStepOnScroll() {
      const scrollPosition = $(window).scrollTop() + viewportHeight() / 2 + navbarHeight;
      let activated = false;
      for (let i = 0; i < steps.length; i++) {
        const step = steps.eq(i);
        const offsetTop = step.offset().top;
        const offsetBottom = offsetTop + step.outerHeight();

        if (!activated && (i == 0 || offsetTop < scrollPosition) && (i == steps.length - 1 || scrollPosition < offsetBottom)) {
          activated = true;
          step.addClass('active');
        } else step.removeClass('active');
      }
    }

    // Activate the steps during scrolling, resizing and right away.
    $(window).scroll(activateStepOnScroll).resize(activateStepOnScroll);
    activateStepOnScroll();

    //
    // Scroll smoothly to the step when clicked.
    //
    $('.trivaa-process-step').click(function () {
      scrollToTarget($(this), true);
    });
  }

  /**
   * Page initialization.
   */

  // Initialize the mobile browser 'address bar jump' fix.
  JumpFix.init();

  // Configure smooth scrolling.
  configureScrollToTarget($('html, body'));

  // Show the page.
  $('.no-fouc').removeClass('no-fouc');

  // Configure the navbar for mobile-specific behaviour.
  configureMobileNavbar();

  // Configure the navbar to dim when needed.
  configureDimmingNavbar();

  // Configure the process part of the page.
  configureProcessPart();
});

/**
 * Ask for Offer form.
 */
$(function () {
  let requestRunning = false;
  const form = $('.trivaa-offer-form');
  const overlay = $('.trivaa-offer-form-overlay');
  const button = $('button.trivaa-ask-for-offer');
  const submitComplete = form.find('.form-submit-complete');

  // Hide the navbar, enable the blur effect and show the form when clicking the button.
  const navbarToggler = $('button.navbar-toggler');
  button.click(() => {
    // Initialize form display, depending on state.
    if (form.hasClass('form-hidden')) {
      // Hide the collapsible mobile navbar, if it's visible.
      if (navbarToggler.is(':visible')) navbarToggler.click();

      // Reset the form if no request is running.
      if (!requestRunning) {
        // Show the form content.
        form.find('.form-content').removeClass('content-hide');

        // Hide additional content.
        form.find('.additional-content-show').removeClass('additional-content-show');
      }
    }

    // Blur/unblur the main content.
    $('div#mainContent').toggleClass('blur');

    // Prevent the body from scrolling or reenable it.
    $('body').toggleClass('noscroll');

    // Show/hide the form and the overlay.
    form.toggleClass('form-hidden');
    overlay.toggleClass('overlay-active');
  });

  // All 'Ask for Offer' links activate the button.
  $('a.trivaa-ask-for-offer').click((e) => {
    e.preventDefault();
    button.click();
  });

  // Clicking on the overlay hides the form.
  overlay.click(() => {
    if (!form.hasClass('form-hidden')) button.click();
  });

  // Swiping left also closes the form.
  const hammerTime = new Hammer(form.get(0), {
    recognizers: [
      [Hammer.Swipe, {
        direction: Hammer.DIRECTION_HORIZONTAL
      }]
    ]
  });
  hammerTime.on('swipe', function (e) {
    if (e.direction == Hammer.DIRECTION_LEFT) button.click();
  });

  // Anchors mark their selection, except for action buttons.
  form.find('a').click(function (e) {
    e.preventDefault();
    const anchor = $(this);
    if (!anchor.hasClass('action-button')) {
      // See if the button is in a group. Unselect all others in the same group.
      const group = anchor.data('button-group');
      if (group && !anchor.hasClass('selected-anchor'))
        form.find(`div.form-section a[data-button-group="${group}"]`).removeClass('selected-anchor');

      // Toggle the class making the selection.
      anchor.toggleClass('selected-anchor');
    }
  });

  // The 'Other...' button makes the corresponding textbox visible.
  form.find('a#softwareKindOther').click(() => form.find('input#softwareKindOtherText').toggleClass('input-active'));

  // The close button also hides the form.
  form.find('a#closeForm').click(() => {
    if (!form.hasClass('form-hidden')) button.click();
  });

  // Submit button logic.
  form.find('a#sendOfferRequest').click(() => {
    // Collect the form contents.
    const emailInput = form.find('input#contactEmail');
    const emailAddress = emailInput.val().trim();
    const re = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
    if (!emailAddress || !re.test(emailAddress)) {
      emailInput.focus();
      return;
    }

    // Hide the form content.
    form.find('.form-content').addClass('content-hide');

    // Show the spinner.
    form.find('.form-spinner').addClass('additional-content-show');

    const offerRequest = {
      language: $(`meta[name="page-language"]`).attr('content'),
      software: {
        mobile: form.find('a#softwareKindMobile').hasClass('selected-anchor'),
        web: form.find('a#softwareKindWeb').hasClass('selected-anchor'),
        database: form.find('a#softwareKindDatabase').hasClass('selected-anchor'),
        other: form.find('a#softwareKindOther').hasClass('selected-anchor') && form.find('input#softwareKindOtherText').val().trim()
      },
      reverseEngineering: form.find('a#existingReveng').hasClass('selected-anchor'),
      emailAddress: emailAddress
    };

    // Send the request.
    requestRunning = true;
    const responseDelay = 400;
    $.ajax('https://trivaacloud1.trivaalogic.hu/offerservice', {
      method: 'POST',
      data: JSON.stringify(offerRequest),
      contentType: 'application/json; charset=utf-8',
      dataType: 'text'
    }).done((msg) => {
      // Display the outcome.
      setTimeout(() => {
        submitComplete.find('span').hide();
        if (msg == 'ok') submitComplete.find('span#submitSuccess').show();
        else submitComplete.find('span#submitFail').show();
      }, responseDelay);
    }).fail(() => {
      setTimeout(() => {
        submitComplete.find('span').hide();
        submitComplete.find('span#submitFail').show();
      }, responseDelay);
    }).always(() => {
      setTimeout(() => {
        // Show the message.
        submitComplete.addClass('additional-content-show');

        // Hide the spinner.
        form.find('.form-spinner').removeClass('additional-content-show');

        // Update the state.
        requestRunning = false;
      }, responseDelay);
    });
  });
});