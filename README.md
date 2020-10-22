# Xibo Interactive Control

This library is meant to be used with Xibo () Digital Signage Players, and handles the manupilation of ...

## Instalation

Copy src/xibo-interactive-control.js to the module folder in the CMS or add to any HTML file.

### Add to a CMS module

Library JS file needs to be added to the getResource() method in the module's PHP file (optionaly we can add the widget/target id).

Example:

```php
$javacriptToAdd = '<script type="text/javascript">var xiboICTargetId = ' . $this->getWidgetId() . ';</script>';
$javacriptToAdd .= '<script type="text/javascript" src="' . $this->getResourceUrl('xibo-interactive-control.js') . '"></script>';
$data['javaScript'] = $javacriptToAdd;
return $this->renderTemplate($data);
```

## Library usage

### Config Library

Use to update the default parameters used to connect with the server. By default the requests are made locally ( '/info' for example ), but by changing the following parameters we can connect to a remote server

```javascript
xiboIC.config(libOptions)
```

- libOptions.protocol
- libOptions.hostname
- libOptions.port
- libOptions.headers: Array of headers in the format “key: value” ( e.g. _[{ key: 'Content-Type', value: 'application/x-www-form-urlencoded' }]_ )

#### All the following methods will have a **reqOptions** parameter with the following options:

- reqOptions.done: callback to run when the request is successful
- reqOptions.error: callback to run when the request fails

### Get Player Info

Get information about the player

```javascript
xiboIC.info(reqOptions)
```

### Trigger action/web-hook

Trigger action in the parent player

```javascript
xiboIC.trigger(code, reqOptions)
```

- **code**: trigger code for the web-hook that initiates an action in the parent player

### Add function to the queue

Add a function to a queue so it can be ran later

```javascript
xiboIC.addToQueue(callback, ...args)
```

- **callback**: function definition
- **args**: comma separated arguments for the target function

### Run full queue

Run all the pending function in the queue ( and remove them )

```javascript
xiboIC.runQueue()
```

### Set as visible

Set widget state as visible and run **runQueue()**

```javascript
xiboIC.setVisible()
```

### Expire

Expire current widget

```javascript
xiboIC.expireNow(reqOptions)
```

- **reqOptions.targetId**: target widget id ( if not provided, default id will be used )

### Extend duration

Extend widget duration using a given value

```javascript
xiboIC.extendWidgetDuration(extend, reqOptions)
```

- **extend**: value in seconds to be added to the widget current duration
- **reqOptions.targetId**: target widget id ( if not provided, default id will be used )

### Set duration

Set widget duration to a given value

```javascript
xiboIC.setWidgetDuration(duration, reqOptions)
```

- **duration**: value in seconds to replace the widget current duration
- **reqOptions.targetId**: target widget id ( if not provided, default id will be used )
