'use strict';
window.addEventListener('load', () => {				// change paths line 111 158 for production

	const selectSystem = document.querySelector('#dzsystem-id');
	const jumpSystem = document.querySelector('#main');
	const loadNumber = document.querySelector('#pload');
	const diverId = document.querySelector('#diverId');
	const jumpPrice = document.querySelector('#price');
	const jumpSelected = document.querySelector('#dzjump-id');
	const jumpAmount = document.querySelector('#dzdiver-jumps');
	// const jumpInfo passed with html in adddiver.ctp and diverload.ctp and addstud.ctp and studload.ctp
	// const taxPaidTill passed with html in diverload.ctp
	const nameInput = document.querySelector('#divername');
	const couponCode = document.querySelector('#couponnr');
	
	let jump = jumpSelected.value;
	let priceLevel = 0;
	
	if (typeof loadNumber !== 'undefined' && loadNumber !== null) {
		loadNumber.addEventListener('change', makeSystemList);
		loadNumber.addEventListener('change', setButtonText);
	}
	
	jumpSelected.addEventListener('change', isSystemNeeded);
	jumpSelected.addEventListener('change', updatePriceFromJump);
	jumpPrice.addEventListener('gottax', updatePriceFromTax);
	
	if (selectSystem) {selectSystem.addEventListener('change', setSystemForJump);}
	
	if (selectSystem.value !=='') {jumpSystem.readOnly = true;}
	
  if (typeof nameInput !== 'undefined' && nameInput !== null) {
		nameInput.addEventListener('keyup', fillDiverInfo);
	  if (nameInput.textLength === 0) nameInput.focus();
	}
	
	if (couponCode) {couponCode.addEventListener('keyup', checkIfCouponValid);}

	// Autocomplete functions START****************************************************START
	const autocompleteParams = {
		apiUrl: '',
		queryField: '',
		queryValue: '',
		inputElement: '',
		furtherActions:'',
	};

  function prepareJsonRequest(requestElements) {
		const apiHeaders = new Headers();
		apiHeaders.set('Accept', 'application/json');
		const apiPath = `${requestElements.apiUrl}?
			${requestElements.queryField}=
			${requestElements.queryValue}`;
    return new Request(apiPath, {
			headers: apiHeaders
    });
  }
	
	async function fetchJsonData(request) {
		try {
			const arrayAfterFetch = await (await fetch(request)).json();
			return arrayAfterFetch;
    }
    catch (err) {
			console.log('fetch failing', err);
			return null;
    }
  }

  function makeOptionList(arrayAfterFetch, inputElement) {
		const listElementId = `#${inputElement.getAttribute('list')}`;
		const dataListElement = document.querySelector(listElementId);
		dataListElement.innerHTML = '';
		arrayAfterFetch.forEach(listItem => {
			const option = document.createElement('option');
			option.value = listItem.id;
			option.textContent = listItem.name;
			dataListElement.appendChild(option);
		});
		return dataListElement;
	}

	function fetchAndUpdate(autocompleteParams) {
		const request = prepareJsonRequest(autocompleteParams);
		fetchJsonData(request)
      .then((arrayAfterFetch) => {
				const optionList = makeOptionList(arrayAfterFetch, autocompleteParams.inputElement);
				const forSelection = {
					fetchedArray: arrayAfterFetch,
					optionList: optionList,
				};
				const flag = autocompleteParams.inputElement.dataset.inputEventFlag;
				if (!flag) {
					autocompleteParams.inputElement.addEventListener('input', autocompleteParams.furtherActions.bind(forSelection));
					if (flag === undefined) {
						autocompleteParams.inputElement.dataset.inputEventFlag = false;
					}
				}
			})
	}
	// Autocomplete functions END****************************************************END

  // Section Check Coupon START**********************************************************START
  function checkIfCouponValid(e) {
		if ((this.value.length < 2) || (this.value.length > 5) ||
		(e.key === 'ArrowDown') || (e.key === 'ArrowUp')) {
		  return;																							// do not process the input here, leave it for the DOM to process
		}

				// hard coded DATA START********************************
		autocompleteParams.apiUrl = '/dzcoupons/checkcoupon';			// Adjust URL for production environment <----------------IMPORTANT
		autocompleteParams.queryField = 'coupon';
		autocompleteParams.inputElement = couponCode;
		autocompleteParams.furtherActions = couponPaidCheck;	// function name: what to do having the autocomplete option selected
				// hard coded DATA END********************************

		autocompleteParams.queryValue = this.value;
		fetchAndUpdate(autocompleteParams);
	}

	function couponPaidCheck(e) {
		const selectedOne = this.fetchedArray.find(option => option.id == e.target.value);
		const validTill = selectedOne.expires.split('T')[0];
		this.optionList.innerHTML = '';
		if (typeof selectedOne !== 'undefined') e.target.value = selectedOne.name+' Galioja iki: '+validTill;
		let paidText;
		
		if (selectedOne.paid === true) {
			paidText = '<b>Apmokėtas</b>';
			new Date(validTill) >= Date.now() ?
				e.target.style = 'background-color: lightgreen' :
				e.target.style = 'background-color: salmon';
		} else {
			paidText = '<b>NEapmokėtas</b>';
			e.target.style = 'background-color: red';
		}
		
		let couponPaidElement = document.querySelector('#iscouponpaid');
		if (couponPaidElement) {
			couponPaidElement.innerHTML = 'Čekis ' + paidText;
		} else {
			couponPaidElement = document.createElement('p');
			couponPaidElement.id = 'iscouponpaid';
			couponPaidElement.innerHTML = 'Čekis ' + paidText;
			autocompleteParams.inputElement.parentElement.appendChild(couponPaidElement);
		}
	}
// Section Check Coupon END************************************************************END

// Section Input Diver Data START*******************************************************************START
  function fillDiverInfo(e) {
    if ((this.value.length < 3) || (this.value.length > 7) ||
        (e.key === 'ArrowDown') || (e.key === 'ArrowUp')) {
				return;																							// do not process the input event
		}

				// hard coded DATA START********************************
		autocompleteParams.apiUrl = '/dzloads/adddiver';			// Adjust URL for production environment <----------------IMPORTANT
		autocompleteParams.queryField = 'diver';
		autocompleteParams.inputElement = nameInput;
		autocompleteParams.furtherActions = diverDataUpdate;	// function name: what to do having the autocomplete option selected
				// hard coded DATA END********************************
		
		autocompleteParams.queryValue = this.value;
		fetchAndUpdate(autocompleteParams);
	}

	function diverDataUpdate(e) {
		const selectedOne = this.fetchedArray.find(option => option.id == e.target.value);
		this.optionList.innerHTML = '';

		if (typeof selectedOne !== 'undefined') e.target.value = selectedOne.name;
		diverId.value = selectedOne.id;
		jumpSystem.value = selectedOne.main;
		jumpAmount.value = selectedOne.jumps;
				const eventGotTaxData = new CustomEvent('gottax', {
				  detail: {text: selectedOne.imok}
				});
				jumpPrice.dispatchEvent(eventGotTaxData);         // update jump price after diver selected
	}
  // Section Input Diver Data END*******************************************************************END

  // section warn before updating amount of jumps START *********************************************START***
  if (jumpAmount) {jumpAmount.addEventListener('change', jumpChangeWarning);}
	
  function jumpChangeWarning() {
  	const infoNote = document.querySelector('#jump-infonote');
  	infoNote.style.visibility = 'visible';
  	setTimeout(() => {infoNote.style.visibility = 'hidden'
  	}, 3000);
  }
  // section warn before updating amount of jumps END ***********************************************END***

  // section price set START **********************************************************START***
  if (typeof taxPaidTill !== 'undefined') {     // check if const taxPaidTill was received by html
	const eventGotTaxData = new CustomEvent('gottax', {
	    detail: {text: taxPaidTill}
	});
	jumpPrice.dispatchEvent(eventGotTaxData);
  }

  function updatePriceFromTax(e) {              // check if Tax paid
	let imokpaid = e.detail.text;
	if (imokpaid != '') {
	  const today = new Date();
	  const label = document.querySelector('label[for="price"]');
	  imokpaid = new Date(imokpaid);
	  if (imokpaid <= today) {
		priceLevel = 1;		        // Tax overdue, price level set to 1, price1
		label.textContent = 'Šuolio kaina, nario mokestis NEsumokėtas';
	  } else {
		priceLevel = 0;		        // Tax paid, price level set to 0, price
		label.textContent = 'Šuolio kaina, nario mokestis sumokėtas';
	  }
	}
	  if (jump != 40) {             // prevent default field for it is never included into jumpInfo variable
		updatePrice();
	  }
  };

  function updatePriceFromJump() {
	jump = jumpSelected.value;
	if (jump != 40) {               // prevent default field for it is never included into jumpInfo variable
		updatePrice();
	} else {
		jumpPrice.value = '';
	}
  }

  function updatePrice() {          // price if Tax paid, price1 if Tax overdue
	if (priceLevel ==0) {
      jumpPrice.value = jumpInfo.find(element => element.id == jump).price;
      return;
	}
    jumpPrice.value = jumpInfo.find(element => element.id == jump).price1;
  }
  // section price set END **************************************************************END***

  // section Buttons rename START **********************************************************START***
  function setButtonText() {
	const loadButtonIn = document.querySelector('#loadButtonIn');
	if (!loadButtonIn) {return;}	// check the template
    const loadButtonOut = document.querySelector('#loadButtonOut');
	loadButtonIn.textContent = "Perkelti į pakilimą " + loadNumber.value;
	loadButtonOut.textContent = "Pašalinti iš pakilimo " + loadNumber.value;
  }
  // section Buttons rename END **************************************************************END***

  // section figure out client systems available for the load************************START***
	function makeSystemList() {
		if ((typeof dzsystems == 'undefined') || (typeof sysLoads == 'undefined')) {return;}	// if not suitable template sent by html
		const tmpSysList = Object.assign({}, dzsystems);	//const dzsystems sent by html
		const systemsInLoad = sysLoads.filter(sysInLoad => sysInLoad[1] == loadNumber.value);		// only the systems in the event load

		systemsInLoad.forEach((systemInLoad) => {					// make a list of systems available for this load
			delete tmpSysList[systemInLoad[0]];
		});

	  const optionList = [];														// make new list of systems for selection dropdown options
	  for(let key in tmpSysList) {
		  optionList.push([key, tmpSysList[key]]);
	  }
	
	  selectSystem.options.length=0;										// put together a new select dropdown options list
	  selectSystem.options.length=optionList.length+1;
	  for (let i=1; i<optionList.length+1; i++) {
		  selectSystem.options[i].value=optionList[i-1][0];
		  selectSystem.options[i].textContent = optionList[i-1][1];
	  }
  }
  // section figure out client systems available for the load**************************END***

  // section dim fields if not needed START *****************************************START***
	function isSystemNeeded() {
		if ((jumpSelected.value == 15) ||			// TD-st
		(jumpSelected.value == 32) ||					// TD-st+F
		(jumpSelected.value == 33))						// TD-st+FO
		{
			selectSystem.disabled = true;
			selectSystem.value = null;
			jumpSystem.disabled = true;
			jumpSystem.value = null;
		} else {
			selectSystem.disabled = false;
			jumpSystem.disabled = false;
		}
	}
  // section dim fields if not needed END *********************************************END***

  // section system for jump START **********************************************************START***
  function setSystemForJump() {
	jumpSystem.value = selectSystem[selectSystem.selectedIndex].textContent;
	if (selectSystem.value !=='') {
		jumpSystem.readOnly = true;
	} else {
		jumpSystem.readOnly = false;
	}
  }
  // section system for jump END **************************************************************END***

}) // end of Window event